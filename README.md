## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm list pdfjs-dist`

Checks the pdfjs ver.
Standalone file, and file within react-pdf must be the same.

## Component Files

### Signature Placeholder

handles the signature field after being dragged

### SignatureDraggable

Handles the dragging of the signature field from the page onto the pdf

### PlacedSignature

Handles the signature(after signature field is signed/filled inside pdf)

### myPdfViewer
Components:
- selectedFile: PDF file to render
- setPageDims: Callback to store PDF page dimensions
- signatureFields: Array of signature field objects { id, x, y, url }
- setSignatureFields: Setter to update signature fields
- setActiveFieldId: Setter to track which field is being signed
- handleOpenSignatureModal: Function to open the signature modal
- hasDroppedSignature: Boolean flag to prevent duplicate drops
- setHasDroppedSignature: Setter to update drop status

🖼️ PDF Rendering
- Uses react-pdf's '<Document />' and '<Page />' to render the first page
- Disables text and annotation layers for cleaner visuals
- Captures page dimensions via onRenderSuccess for accurate field placement

🖱️ Drag-and-Drop Behavior
- Uses react-dnd's useDrop to accept SIGNATURE_SLOT items
- Calculates drop position using monitor.getSourceClientOffset() and container bounds
- Adjusts y position slightly to align field visually
- Prevents multiple drops using hasDroppedSignature

🖊️ Signature Field Rendering
- Unsigned fields: Rendered as SignaturePlaceholder, draggable and clickable
- Signed fields: Rendered as PlacedSignature, non-draggable and static
- Each field is positioned absolutely based on its x and y values

## App

Has all buttons, input fields, modal functionalities, and calls all components.


### Frontend Tech Stack

React
React DnD  -  Drag and drop for sig fields
React PDF  -  Rendering pdf documents
pdf-lib  - embedding signatures into PDF files