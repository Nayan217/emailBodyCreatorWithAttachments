/** Disposition chosen by the user in the attachment table UI. */
export type Disposition = 'inline' | 'attach';

/**
 * Represents a single uploaded file after processing.
 * Created in server.ts and passed through all server-side modules.
 */
export interface FileData {
  /** EJS variable name this file is bound to (e.g. "reportFile"). */
  varName:   string;
  name:      string;
  type:      string;
  size:      string;   // human-readable, e.g. "1.2 MB"
  sizeBytes: number;
  base64:    string;
  dataUrl:   string;
  isImage:   boolean;
  /** true  → rendered as <img cid:…> in the HTML body */
  isInline:  boolean;
  /** true  → sent as Content-Disposition: attachment MIME part */
  isAttach:  boolean;
  /** Content-ID for inline images (null for non-images). */
  cid:       string | null;
}

/** A single plain-text key/value variable from the Variables table. */
export interface TemplateVar {
  key:   string;
  value: string;
}

/** One entry in the attachmentMeta JSON array. */
export interface AttachmentMeta {
  varName:     string;
  disposition: Disposition;
}

/** Arguments accepted by mimeBuilder.build(). */
export interface BuildOptions {
  htmlBody:  string;
  allFiles:  FileData[];
  from:      string;
  to:        string;
  cc:        string;
  subject:   string;
}

/** Shape of the JSON response from POST /build. */
export interface BuildResponse {
  ok:              true;
  eml:             string;
  htmlBodyEmail:   string;
  htmlBodyPreview: string;
}

export interface BuildErrorResponse {
  ok:    false;
  error: string;
}
