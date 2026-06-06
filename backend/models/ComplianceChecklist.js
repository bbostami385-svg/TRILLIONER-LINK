import mongoose from 'mongoose';

const complianceChecklistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    accountType: {
      type: String,
      enum: ['standard', 'institutional', 'vip'],
      required: true,
    },

    // Basic KYC Checklist
    basicKYC: {
      emailVerified: {
        type: Boolean,
        default: false,
      },
      phoneVerified: {
        type: Boolean,
        default: false,
      },
      addressVerified: {
        type: Boolean,
        default: false,
      },
      identityDocumentSubmitted: {
        type: Boolean,
        default: false,
      },
      identityDocumentVerified: {
        type: Boolean,
        default: false,
      },
      selfieVerified: {
        type: Boolean,
        default: false,
      },
      termsAccepted: {
        type: Boolean,
        default: false,
      },
      privacyPolicyAccepted: {
        type: Boolean,
        default: false,
      },
      ageVerified: {
        type: Boolean,
        default: false,
      },
    },

    // Enhanced KYC (For VIP & Institutional)
    enhancedKYC: {
      sourceOfFundsVerified: {
        type: Boolean,
        default: false,
      },
      bankAccountVerified: {
        type: Boolean,
        default: false,
      },
      taxIdVerified: {
        type: Boolean,
        default: false,
      },
      backgroundCheckCompleted: {
        type: Boolean,
        default: false,
      },
      backgroundCheckResult: String, // 'clear', 'pending', 'failed'
      pep_check: {
        type: Boolean,
        default: false,
      }, // Politically Exposed Person
      sanctionsCheckCompleted: {
        type: Boolean,
        default: false,
      },
      sanctionsCheckResult: String, // 'clear', 'pending', 'flagged'
    },

    // Institutional Specific
    institutionalKYC: {
      businessRegistrationVerified: {
        type: Boolean,
        default: false,
      },
      businessLicenseVerified: {
        type: Boolean,
        default: false,
      },
      taxIdVerified: {
        type: Boolean,
        default: false,
      },
      authorizedRepresentativeVerified: {
        type: Boolean,
        default: false,
      },
      companyAddressVerified: {
        type: Boolean,
        default: false,
      },
      complianceDocumentsSubmitted: {
        type: Boolean,
        default: false,
      },
      regulatoryApprovalObtained: {
        type: Boolean,
        default: false,
      },
    },

    // Document Submission Status
    documents: [
      {
        documentType: String,
        status: {
          type: String,
          enum: ['pending', 'submitted', 'verified', 'rejected'],
          default: 'pending',
        },
        submissionDate: Date,
        verificationDate: Date,
        rejectionReason: String,
        resubmissionRequired: Boolean,
      },
    ],

    // Compliance Status
    overallComplianceStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'compliant', 'non_compliant', 'review_required', 'suspended'],
      default: 'not_started',
    },
    compliancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Risk Assessment
    riskAssessment: {
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
      },
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      riskFactors: [String],
      lastAssessmentDate: Date,
      flaggedForReview: {
        type: Boolean,
        default: false,
      },
    },

    // Verification History
    verificationHistory: [
      {
        date: Date,
        checkType: String,
        result: String,
        verifiedBy: String,
        notes: String,
      },
    ],

    // Compliance Actions
    complianceActions: [
      {
        actionId: mongoose.Schema.Types.ObjectId,
        actionType: String, // 'document_request', 'resubmission_required', 'suspension'
        actionDate: Date,
        dueDate: Date,
        status: {
          type: String,
          enum: ['pending', 'completed', 'overdue'],
          default: 'pending',
        },
        description: String,
        completionDate: Date,
      },
    ],

    // Notifications
    notifications: {
      pendingDocumentReminder: {
        type: Boolean,
        default: false,
      },
      verificationDelayNotification: {
        type: Boolean,
        default: false,
      },
      complianceWarning: {
        type: Boolean,
        default: false,
      },
    },

    // Approval Workflow
    approvalWorkflow: {
      submittedForReview: {
        type: Boolean,
        default: false,
      },
      submittedDate: Date,
      reviewedBy: String,
      reviewDate: Date,
      approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'needs_revision'],
        default: 'pending',
      },
      reviewNotes: String,
      approvalNotes: String,
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastReviewDate: Date,
    nextReviewDate: Date,
  },
  { timestamps: true }
);

// Index
complianceChecklistSchema.index({ userId: 1 });
complianceChecklistSchema.index({ accountType: 1 });
complianceChecklistSchema.index({ overallComplianceStatus: 1 });

// Methods
complianceChecklistSchema.methods.calculateCompliancePercentage = function () {
  let totalItems = 0;
  let completedItems = 0;

  const basicKYCItems = Object.values(this.basicKYC);
  totalItems += basicKYCItems.length;
  completedItems += basicKYCItems.filter((item) => item === true).length;

  if (this.accountType === 'vip' || this.accountType === 'institutional') {
    const enhancedKYCItems = Object.values(this.enhancedKYC);
    totalItems += enhancedKYCItems.length;
    completedItems += enhancedKYCItems.filter((item) => item === true).length;
  }

  if (this.accountType === 'institutional') {
    const institutionalKYCItems = Object.values(this.institutionalKYC);
    totalItems += institutionalKYCItems.length;
    completedItems += institutionalKYCItems.filter((item) => item === true).length;
  }

  this.compliancePercentage = Math.round((completedItems / totalItems) * 100);
  return this.compliancePercentage;
};

complianceChecklistSchema.methods.updateComplianceStatus = function () {
  this.calculateCompliancePercentage();

  if (this.compliancePercentage === 100) {
    this.overallComplianceStatus = 'compliant';
  } else if (this.compliancePercentage >= 50) {
    this.overallComplianceStatus = 'in_progress';
  } else {
    this.overallComplianceStatus = 'not_started';
  }

  return this.save();
};

complianceChecklistSchema.methods.addVerificationRecord = function (verificationData) {
  this.verificationHistory.push({
    ...verificationData,
    date: new Date(),
  });
  return this.save();
};

complianceChecklistSchema.methods.addComplianceAction = function (actionData) {
  this.complianceActions.push({
    ...actionData,
    actionId: new mongoose.Types.ObjectId(),
    actionDate: new Date(),
  });
  return this.save();
};

complianceChecklistSchema.methods.isCompliant = function () {
  return this.overallComplianceStatus === 'compliant';
};

complianceChecklistSchema.methods.isPending = function () {
  return this.overallComplianceStatus === 'in_progress';
};

complianceChecklistSchema.methods.requiresReview = function () {
  return this.overallComplianceStatus === 'review_required';
};

export default mongoose.model('ComplianceChecklist', complianceChecklistSchema);
