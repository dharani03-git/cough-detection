/**
 * HL7 FHIR DiagnosticReport Export Utility
 * Generates an FHIR-compliant DiagnosticReport resource for respiratory screenings.
 */

export function generateFHIRDiagnosticReport(patientName: string, result: any, symptoms: any) {
  const report = {
    resourceType: "DiagnosticReport",
    id: `resono-${Date.now()}`,
    status: "final",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v2-0074",
        code: "GE",
        display: "General Inventory"
      }]
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "100047-0",
        display: "Respiratory system screening"
      }],
      text: "Acoustic Respiratory Screening"
    },
    subject: {
      display: patientName
    },
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    conclusion: result.prediction,
    conclusionCode: [{
      text: `${result.prediction} detected with ${(result.confidence * 100).toFixed(1)}% confidence`
    }],
    result: [
      {
        display: "Acoustic Biomarkers",
        extension: [
          { url: "fev1_fvc_ratio", valueDecimal: result.biomarkers?.fev1_fvc_ratio },
          { url: "respiratory_score", valueInteger: result.biomarkers?.respiratory_score },
          { url: "risk_level", valueString: result.risk_level }
        ]
      }
    ],
    note: [{
      text: `Symptoms reported: Fever: ${symptoms.fever}, Dyspnea: ${symptoms.breathingDifficulty}, Cough: ${symptoms.coughType}`
    }]
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `FHIR_Report_${patientName.replace(/\s+/g, '_')}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
