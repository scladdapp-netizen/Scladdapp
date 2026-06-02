import Button from "../../../components/Button/Button";
import FormInput from "../../../components/FormInput";

export default function StepTwo({
  onNext,
  onBack,
  school_country,
  school_state,
  school_address,
  updateSchoolData,
}) {
  return (
    <div className="stepform">
      <FormInput
        label="Country"
        type="select"
        value={school_country}
        onChange={(value) => updateSchoolData("school_country", value)}
        options={[
          { label: "Nigeria", value: "NG" },
          { label: "Ghana", value: "GH" },
          { label: "Kenya", value: "KE" },
        ]}
      />
      <FormInput
        label="State"
        type="text"
        value={school_state}
        onChange={(value) => updateSchoolData("school_state", value)}
      />
      <FormInput
        label="Address"
        type="text"
        value={school_address}
        onChange={(value) => updateSchoolData("school_address", value)}
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
    </div>
  );
}
