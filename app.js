import signer, { plainAddPlaceholder } from 'node-signpdf';
import report from 'puppeteer-report'
import puppeteer from 'puppeteer'
import express from 'express'
import fs from 'fs'

const app = express()
app.get('/', async (req, res) => {
  const html = `<p>Hello world sign me!</p>`

  // Need to convert these bytes to Buffer, as it currently throws an error signing (next step).
  const bytes = await _generate(html)
  // Signing with node-signpdf
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
    await page.setContent(`${html}`);
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
    const placeholderPdfBuffer = plainAddPlaceholder({
      pdfBuffer: input,
      reason: "This is but a test",
      name: "John Doe",
      contactInfo: "email@example.com",
    });

    const signedBuffer = await signer.sign(placeholderPdfBuffer, certBuffer);
    //////////////////////////////////////////////
    // Do something with the signed buffer here //
    //////////////////////////////////////////////


    return "File signed sucessfully!"
  } catch (err) {
    console.log('Failed to sign a contract: ', err)
    return `Failed to sign a contract: ${err}`
  }
}