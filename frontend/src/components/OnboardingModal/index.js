import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stepper,
  Step,
  StepLabel,
  Box,
} from "@material-ui/core";

import OrganizationSetup from "./steps/OrganizationSetup";
import CloudAccountSetup from "./steps/CloudAccountSetup";
import EnvironmentSetup from "./steps/EnvironmentSetup";

import styles from "./style.module.scss";

const steps = [
  "Organization Setup",
  "Cloud Account Setup", 
  "Environment Setup"
];

const OnboardingModal = ({ open, onClose, onComplete }) => {
  
  const [activeStep, setActiveStep] = useState(0);
  const [organizationData, setOrganizationData] = useState(null);
  const [cloudAccountData, setCloudAccountData] = useState(null);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleOrganizationComplete = (data) => {
    setOrganizationData(data);
    handleNext();
  };

  const handleCloudAccountComplete = (data) => {
    setCloudAccountData(data);
    handleNext();
  };

  const handleEnvironmentComplete = () => {
    onComplete();
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <OrganizationSetup
            onComplete={handleOrganizationComplete}
            onBack={handleBack}
          />
        );
      case 1:
        return (
          <CloudAccountSetup
            organizationId={organizationData?.id}
            onComplete={handleCloudAccountComplete}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <EnvironmentSetup
            organizationId={organizationData?.id}
            cloudAccountId={cloudAccountData?.id}
            onComplete={handleEnvironmentComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Test div to see if component is rendering */}
      {/* {open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2>Test Modal - OnboardingModal is rendering!</h2>
            <p>Open: {open.toString()}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      )} */}
      
      <Dialog
        open={open}
        onClose={() => {}} // Prevent closing by clicking outside or pressing escape
        maxWidth="md"
        fullWidth
        className={styles["onboarding-modal"]}
        disableBackdropClick
        disableEscapeKeyDown
      >
        <DialogTitle className={styles["onboarding-modal__header"]}>
          <div className={styles["onboarding-modal__title"]}>
            Welcome to Launchpad Setup
          </div>
        </DialogTitle>
        
        <DialogContent className={styles["onboarding-modal__content"]}>
          <Box className={styles["onboarding-modal__stepper"]}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
          
          <Box className={styles["onboarding-modal__step-content"]}>
            {renderStepContent()}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OnboardingModal;
