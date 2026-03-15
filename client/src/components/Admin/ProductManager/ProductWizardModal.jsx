import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { STEP_LABEL_KEYS, STEPS } from "@/hooks/useProductForm";
import { ImagesStep, InfoStep, ReviewStep, VariantsStep } from "../ProductForm";

function renderStepContent({
  currentStep,
  form,
  handleChange,
  groupedCategories,
  orphanCategories,
  categoryName,
  variants,
  selectedSizes,
  basePrice,
  baseStock,
  minVariantPrice,
  toggleSize,
  setBasePrice,
  setBaseStock,
  generateVariants,
  addVariantRow,
  updateVariantField,
  removeVariantRow,
  existingImages,
  imagePreviews,
  primaryImageIndex,
  isDragging,
  onDrop,
  onDragOver,
  onDragLeave,
  onFilesSelected,
  removeExistingImage,
  removeNewImage,
  setAsPrimary,
  reorderImages,
}) {
  switch (currentStep) {
    case STEPS.INFO:
      return (
        <InfoStep
          form={form}
          handleChange={handleChange}
          groupedCategories={groupedCategories}
          orphanCategories={orphanCategories}
          categoryName={categoryName}
        />
      );

    case STEPS.VARIANTS:
      return (
        <VariantsStep
          variants={variants}
          selectedSizes={selectedSizes}
          basePrice={basePrice}
          baseStock={baseStock}
          minVariantPrice={minVariantPrice}
          toggleSize={toggleSize}
          setBasePrice={setBasePrice}
          setBaseStock={setBaseStock}
          generateVariants={generateVariants}
          addVariantRow={addVariantRow}
          updateVariantField={updateVariantField}
          removeVariantRow={removeVariantRow}
          setIsDirty={() => {}}
        />
      );

    case STEPS.IMAGES:
      return (
        <ImagesStep
          existingImages={existingImages}
          imagePreviews={imagePreviews}
          primaryImageIndex={primaryImageIndex}
          isDragging={isDragging}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onFilesSelected={onFilesSelected}
          removeExistingImage={removeExistingImage}
          removeNewImage={removeNewImage}
          setAsPrimary={setAsPrimary}
          reorderImages={reorderImages}
        />
      );

    case STEPS.REVIEW:
      return (
        <ReviewStep
          form={form}
          variants={variants}
          existingImages={existingImages}
          imagePreviews={imagePreviews}
          primaryImageIndex={primaryImageIndex}
          minVariantPrice={minVariantPrice}
          categoryName={categoryName}
        />
      );

    default:
      return null;
  }
}

export default function ProductWizardModal(props) {
  const {
    editingId,
    currentStep,
    showWizard,
    resetForm,
    goToStep,
    canProceed,
    nextStep,
    prevStep,
    handleSubmit,
    isSubmitting,
  } = props;
  const { t } = useTranslation();

  if (!showWizard) return null;

  return (
    <div className="wizard-overlay" onClick={event => event.target === event.currentTarget && resetForm()}>
      <div className="wizard-modal">
        <div className="wizard-header">
          <h2>{editingId ? t("admin.products.editProduct") : t("admin.products.newProduct")}</h2>
          <button className="btn-close" onClick={resetForm}>
            <X size={20} />
          </button>
        </div>

        <div className="wizard-progress">
          {STEP_LABEL_KEYS.map((key, index) => (
            <button
              key={key}
              type="button"
              className={`progress-step ${index === currentStep ? "is-current" : ""} ${index < currentStep ? "is-completed" : ""}`}
              onClick={() => goToStep(index)}
              disabled={index > currentStep && !canProceed(currentStep)}
            >
              <span className="step-number">{index < currentStep ? <Check size={14} /> : index + 1}</span>
              <span className="step-label">{t(key)}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="wizard-content">
          {renderStepContent(props)}

          <div className="wizard-footer">
            <div className="wizard-footer__left">
              {currentStep > STEPS.INFO && (
                <button type="button" className="btn btn-outline" onClick={prevStep}>
                  <ChevronLeft size={16} /> {t("admin.products.wizard.prev")}
                </button>
              )}
            </div>

            <div className="wizard-footer__right">
              <button
                type="button"
                className={`btn btn-primary ${currentStep >= STEPS.REVIEW ? "hidden" : ""}`}
                onClick={nextStep}
                disabled={!canProceed(currentStep)}
              >
                {t("admin.products.wizard.next")} <ChevronRight size={16} />
              </button>
              <button
                type="submit"
                className={`btn btn-primary btn-lg ${currentStep !== STEPS.REVIEW ? "hidden" : ""}`}
                disabled={isSubmitting}
              >
                <Check size={16} /> {isSubmitting ? t("admin.products.wizard.submitting") : editingId ? t("admin.products.wizard.update") : t("admin.products.wizard.create")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
