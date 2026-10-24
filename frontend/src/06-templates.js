/* ----- Email Outreach Templates ----- */
function generateEmailTemplates(a, P) {
  const myName = P?.full_name || 'Candidate';
  const myEmail = P?.email || '';
  const mySchool = P?.school ? ` at ${P.school}` : '';
  const myDegree = P?.degree ? `${P.degree} student${mySchool}` : `student${mySchool}`;
  const company = a.company || 'your organization';
  const role = a.role || 'Internship';
  const recruiter = a.recruiter_name || 'Hiring Team';
  const dateApplied = fmt(a.date_applied) || 'recently';

  return {
    cold: {
      title: 'Cold Outreach',
      subject: `Application for ${role} position - ${myName}`,
      body: `Dear ${recruiter},

I hope this email finds you well.

I am writing to express my strong interest in the ${role} position at ${company}. As a ${myDegree}, I have closely followed ${company}'s work and admire your team's technical impact.

My background aligns well with the key requirements of the role, and I would welcome the opportunity to bring my skills to your projects. I have submitted my formal application through your portal and attached my resume here for your review.

Thank you very much for your time and consideration.

Best regards,
${myName}
${myEmail}`
    },
    followup: {
      title: '14-Day Follow-Up',
      subject: `Following up on ${role} Application - ${myName}`,
      body: `Dear ${recruiter},

I hope you are having a productive week.

I am following up on my application for the ${role} role at ${company}, which I submitted on ${dateApplied}.

I remain enthusiastically interested in the opportunity to join ${company}. Please let me know if there are any additional portfolio links, project samples, or details I can provide to support my application review.

Thank you for your continued time and consideration.

Warm regards,
${myName}
${myEmail}`
    },
    thankyou: {
      title: 'Interview Thank-You',
      subject: `Thank you - ${role} Interview - ${myName}`,
      body: `Dear ${recruiter},

Thank you very much for taking the time to speak with me today regarding the ${role} opportunity at ${company}.

I truly enjoyed learning more about the team's ongoing initiatives and upcoming roadmap. Our discussion further reinforced my excitement about joining ${company} and contributing to these goals.

Please feel free to reach out if you need any additional references or follow-up details. I look forward to the next steps!

Best regards,
${myName}
${myEmail}`
    },
    offer: {
      title: 'Offer Negotiation',
      subject: `${role} Offer Details - ${myName}`,
      body: `Dear ${recruiter},

Thank you so much for extending the offer to join ${company} as a ${role}! I am thrilled about the opportunity to work with the team.

I am currently reviewing the terms of the offer. Before finalizing my decision, I would appreciate the opportunity to discuss a few details regarding the compensation structure and start date flexibility.

Would you be open to a brief 10-minute call this week to review?

Thank you once again for your support throughout this process.

Best regards,
${myName}
${myEmail}`
    }
  };
}

let activeMobileStage = 'Applied';

