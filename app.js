import signer, { plainAddPlaceholder } from 'node-signpdf';
import report from 'puppeteer-report'
import puppeteer from 'puppeteer'
import express from 'express'
import fs from 'fs'

const app = express()
app.get('/', async (req, res) => {
  const html = `<p>Hello world sign me!</p>`

  // Need to convert these bytes to Buffer as it currently throws an error signing (next step).
  const bytes = await _generate(html)
  // Signing with node-signpdf where it is currently breaking.
  const result = await _sign(bytes)
  res.send(result)
})

const port = 3000
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

async function _generate(html) {
  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage();
    // Starting with puppeteer as this is my use case
    await page.setContent(`${html}`);

    // Now using the -report library (in my real use case I need js on the footer/header)
    const pdfBytes = await report.pdfPage(page, {
      format: "a4",
      margin: {
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
        top: "10mm",
      },
    });
    await browser.close();
    return pdfBytes
  } catch (err) {
    console.log('Failed to generate PDF: ', err)
  }
}

async function _sign(input) {
  try {
    const certBuffer = fs.readFileSync('./cert.p12');

    // This is where it breaks
    const placeholderPdfBuffer = plainAddPlaceholder({
      pdfBuffer: input,
      reason: "This is but a test",
      name: "John Doe",
      contactInfo: "email@example.com",
    });


    const signedBuffer = await signer.sign(placeholderPdfBuffer, certBuffer);
    ///////////////////////////////////////////////////////////////////////////////
    // Do something with the signed buffer here, if it is here it didn't errored //
    ///////////////////////////////////////////////////////////////////////////////
    console.log('File was signed sucessfully, yey!')

    return "File signed sucessfully!"
  } catch (err) {
    console.log('Failed to sign: ', err)
    return `Failed to sign -- ${err}`
  }
}