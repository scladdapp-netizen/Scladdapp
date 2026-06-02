const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useSubjectBooks = () => {
  const getBooksBySubject = async (subjectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-books/subject/${subjectId}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const createBook = async (data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const updateBook = async (bookId, data) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteBook = async (bookId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-books/${bookId}`, {
        method: "DELETE",
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
      const active = (result.data || []).filter((c) => c.is_active === true);
      return { success: true, data: active };
    } catch (err) {
      return { success: true, data: [] };
    }
  };

  return { getBooksBySubject, createBook, updateBook, deleteBook, getActiveClassesBySubject };
};
