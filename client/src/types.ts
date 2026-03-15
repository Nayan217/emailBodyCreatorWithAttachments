/** Disposition chosen by the user in the attachment table. */
export type Disposition = 'inline' | 'attach';

/** One row in the Attachments table. */
export interface AttachRow {
  id:          number;
  varName:     string;
  file:        File | null;
  fileName:    string;
  isImage:     boolean;
  disposition: Disposition;
}

/** One row in the Variables table. */
export interface VarRow {
  id:    number;
  key:   string;
  value: string;
}

/** Email header + title fields. */
export interface EmailConfig {
  from:       string;
  to:         string;
  cc:         string;
  subject:    string;
  emailTitle: string;
}

/** Successful response from POST /build. */
export interface BuildResult {
  ok:              true;
  eml:             string;
  htmlBodyEmail:   string;
  htmlBodyPreview: string;
}

/** Error response from POST /build. */
export interface BuildError {
  ok:    false;
  error: string;
}

export type BuildResponse = BuildResult | BuildError;

/** Shape sent in the attachmentMeta JSON field. */
export interface AttachmentMeta {
  varName:     string;
  disposition: Disposition;
}

/** Shape sent in the templateVars JSON field. */
export interface TemplateVar {
  key:   string;
  value: string;
}
