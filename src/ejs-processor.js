/**
 * src/ejs-processor.js
 * ────────────────────
 * Renders the user's EJS snippet using the real `ejs` npm package.
 *
 * Data context built from fileDataList:
 *   Each file has a varName. That varName becomes a key in the data object
 *   whose value is a SafeString of the rendered HTML for that file.
 *   The raw FileData is also available as <varName>_data.
 *
 * Example — user has two rows:
 *   { varName: 'reportFile', disposition: 'attach' }
 *   { varName: 'headerImage', disposition: 'inline' }
 *
 * Template can use:
 *   <%= reportFile %>       → "report.csv (4.2 KB) is attached."
 *   <%= headerImage %>      → <img src="cid:..."/> (email) or dataUrl (preview)
 *   <%= reportFile_data.name %>   → raw filename string
 */

const ejs       = require('ejs');
const smartBlob = require('./smart-blob');

class SafeString {
  constructor(v) { this.value = String(v); }
  toString()     { return this.value; }
}

function escapeHtml(s) {
  if (s instanceof SafeString) return s.toString();
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * @param {string}       snippet       - user's EJS template
 * @param {FileData[]}   fileDataList  - one entry per attachment row
 * @param {object}       plainVars     - { key: value } plain text variables
 * @param {boolean}      forEmail      - true → cid:/notes, false → dataUrl (preview)
 * @returns {string}  rendered HTML
 */
function render(snippet, fileDataList, plainVars, forEmail) {
  const data = {};

  // Plain key/value variables — available directly as <%= key %>
  Object.assign(data, plainVars);

  for (const fd of fileDataList) {
    if (!fd.varName) continue;
    // The variable itself → rendered HTML (SafeString so <%= %> doesn't double-escape)
    data[fd.varName] = new SafeString(smartBlob.render(fd, forEmail));
    // _data suffix → raw FileData for property access in the template
    data[fd.varName + '_data'] = fd;
  }

  return ejs.render(snippet, data, { escape: escapeHtml, rmWhitespace: false });
}

module.exports = { render };
