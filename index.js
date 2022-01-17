const projectId = 'jobcast-sandbox';
const location = 'us'; // Format is 'us' or 'eu'
const processorId = '5c3e103bc6e20320'; // Create processor in Cloud Console
const filePath = '/Users/johnny/Downloads/Invoice-123.pdf';

const { DocumentProcessorServiceClient } =
  require('@google-cloud/documentai').v1;

// Instantiates a client
// apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
// const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
const client = new DocumentProcessorServiceClient();

(async () => {
  // The full resource name of the processor, e.g.:
  // projects/project-id/locations/location/processor/processor-id
  // You must create new processors in the Cloud Console first
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Read the file into memory.
  const fs = require('fs').promises;
  const imageFile = await fs.readFile(filePath);

  // Convert the image data to a Buffer and base64 encode it.
  const encodedImage = Buffer.from(imageFile).toString('base64');

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: 'application/pdf',
    },
  };

  await parseInvoice(request);
})();

async function parseInvoice(request) {
  const [result] = await client.processDocument(request);
  const { document } = result;

  console.log('document.error', document.error);
  console.log('document.mimeType', document.mimeType);
  console.log('document.pages.length', document.pages.length);

  const data = [
    'invoice_id',
    'invoice_date',
    'due_date',
    'supplier_phone',
    'supplier_email',
    'receiver_name',
    'receiver_email',
    'currency',
    'total_tax_amount',
    'total_amount',
  ]
    .map(t => document.entities.find(e => e.type === t))
    .map(e => ({
      confidence: e?.confidence,
      type: e?.type,
      mentionText: e?.mentionText,
      redacted: e?.redacted,
      'textAnchor.content': e?.textAnchor?.content,
      'normalizedValue.text': e?.normalizedValue?.text,
      normalizedValue: JSON.stringify(e?.normalizedValue),
    }));

  console.table(data);
}

