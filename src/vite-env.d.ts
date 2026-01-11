/// <reference types="vite/client" />

interface Resume {
    id: string;
    resumePath: string;
    imagePath: string;
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    feedback: Feedback;
}

interface Feedback {
    overallScore: number;
    toneAndStyle: FeedbackCategory;
    content: FeedbackCategory;
    structure: FeedbackCategory;
    skills: FeedbackCategory;
    ATS: ATSCategory;
}

interface FeedbackCategory {
    score: number;
    tips: FeedbackTip[];
}

interface ATSCategory {
    score: number;
    tips: ATSTip[];
}

interface FeedbackTip {
    type: "good" | "improve";
    tip: string;
    explanation: string;
}

interface ATSTip {
    type: "good" | "improve";
    tip: string;
}

interface KVItem {
    value: string;
}
