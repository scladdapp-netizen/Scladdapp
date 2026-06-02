import FormInput from "../../../components/FormInput";
import Button from "../../../components/Button/Button";

export default function StepOne({
  onNext,
  school_name,
  school_slogan,
  school_phone,
  school_email,
  school_logo,
  updateSchoolData,
}) {
  return (
    <div className="stepform">
      <FormInput
        label="School Logo"
        type="image"
        value={school_logo}
        onChange={(value) => updateSchoolData("school_logo", value)}
        height="180px"
      />
      <FormInput
        label="School Name"
        type="text"
        value={school_name}
        onChange={(value) => updateSchoolData("school_name", value)}
      />
      <FormInput
        label="School Slogan"
        type="text"
        value={school_slogan}
        onChange={(value) => updateSchoolData("school_slogan", value)}
      />
      <FormInput
        label="School Phone"
        type="text"
        value={school_phone}
        onChange={(value) => updateSchoolData("school_phone", value)}
      />
      <FormInput
        label="School Email"
        type="email"
        value={school_email}
        onChange={(value) => updateSchoolData("school_email", value)}
      />
      <div className="sbl">
        <Button
          variant="primary"
          onClick={onNext}
          // loading={loading}
          // loadingText={"Loading..."}
        >
          Next →
        </Button>
      </div>
      {/* <button onClick={onNext}>Next</button> */}
    </div>
  );
}
