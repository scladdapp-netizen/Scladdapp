const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useSubjectTeachers = () => {
  /**
   * Fetch all teacher assignments for a subject.
   * Groups by teacher_id so each teacher appears once, with all their classes listed.
   * Enriches with teacher profile data (phone, qualification, photo).
   *
   * Returns array of grouped teacher objects:
   * {
   *   teacher_id, teacher_name, teacher_email,
   *   phone, qualification, profile_picture,
   *   is_active,          // true if ANY assignment for this teacher is active
   *   classes: [{ assignment_id, class_id, class_name, is_active, start_date, end_date }]
   * }
   */
  const getTeachersBySubject = async (subjectId) => {
    try {
      if (!subjectId) throw new Error("Subject ID is required");

      // 1. Get all assignments for this subject
      const res = await fetch(`${API_BASE_URL}/teacher-subject/subject/${subjectId}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "Failed to fetch assignments");

      const assignments = result.data || [];
      if (assignments.length === 0) return { success: true, data: [] };

      // 2. Fetch teacher detail for each unique teacher_id
      const uniqueTeacherIds = [...new Set(assignments.map((a) => a.teacher_id))];
      const teacherDetailMap = {};

      await Promise.all(
        uniqueTeacherIds.map(async (teacherId) => {
          try {
            const tRes = await fetch(`${API_BASE_URL}/teacher/${teacherId}/detail`);
            const tResult = await tRes.json();
            if (tResult.success && tResult.data) {
              teacherDetailMap[teacherId] = tResult.data;
            }
          } catch {
            // silently skip if detail fetch fails
          }
        })
      );

      // 3. Group assignments by teacher_id — one entry per teacher
      const grouped = {};
      for (const a of assignments) {
        if (!grouped[a.teacher_id]) {
          const detail = teacherDetailMap[a.teacher_id];
          const staff = detail?.teacher?.staff || {};
          grouped[a.teacher_id] = {
            teacher_id: a.teacher_id,
            teacher_name: a.teacher_name,
            teacher_email: a.teacher_email,
            phone: staff.phone || staff.phone_number || null,
            qualification: staff.qualification || null,
            profile_picture: staff.profile_picture || staff.photo || null,
            is_active: false, // will be set below
            classes: [],
          };
        }
        // Add this class assignment to the teacher's classes list
        grouped[a.teacher_id].classes.push({
          assignment_id: a.assignment_id,
          class_id: a.class_id,
          class_name: a.class_name,
          is_active: a.is_active,
          start_date: a.start_date,
          end_date: a.end_date,
        });
        // Teacher is considered active if any of their assignments is active
        if (a.is_active) grouped[a.teacher_id].is_active = true;
      }

      return { success: true, data: Object.values(grouped) };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deactivateTeacherAssignment = async (assignmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject/${assignmentId}/deactivate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteTeacherAssignment = async (assignmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject/${assignmentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const reactivateTeacherAssignment = async (assignmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject/${assignmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true, end_date: null }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const assignTeacherToSubject = async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const getActiveClassesBySubject = async (subjectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/by-subject/${subjectId}`);
      const result = await res.json();
      if (!result.success) return { success: true, data: [] };
      // Filter to only active ones
      const active = (result.data || []).filter((c) => c.is_active === true);
      return { success: true, data: active };
    } catch (err) {
      return { success: true, data: [] };
    }
  };

  return { getTeachersBySubject, deactivateTeacherAssignment, deleteTeacherAssignment, reactivateTeacherAssignment, assignTeacherToSubject, getActiveClassesBySubject };
};
