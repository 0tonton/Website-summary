import * as cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();
const apiKey = process.env.MISTRAL_API_KEY;

async function fetchPageText(url: string): Promise<string> {

  try {
    const response = await fetch(url);

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`)

    const html = await response.text();

    const $ = cheerio.load(html);
    $("footer").remove();
    $("nav").remove();
    $("script").remove();
    $("style").remove();
    return $("body").text();
  }
  catch (error) {
    throw new Error(`Error fetching website: ${error}`);
  }
}

async function summarize(text: string): Promise<string> {
  const myPrompt: string = `You're a french expert in summarizing texts. What I'll give you is the body of a website. You need to \
  deduct what kind of website it is, what is its purpose, et do a concise but understandable french summary of the body given. The information given \
  must be sourced and in French. The body of the website is: ${text}`;

  const myBody = {
    model: "mistral-small-latest",
    messages: [{ role: "user", content: myPrompt }],
  };

  try {
    if (!apiKey)
      throw new Error("Couldn't find API key");

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(myBody),
    });

    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);

    const rep = await response.json();
    return rep.choices[0].message.content;
  }
  catch (error) {
    throw new Error(`Error sending POST: ${error}`);
  }
}

async function main() {
  let url: string;
  if (process.argv.length > 2) {
    url = process.argv[2];
  } else {
    url = "https://www.alternea.eu/";
  }

  try {
  const page = await fetchPageText(url);
  console.log(await summarize(page));
  }
  catch (error) {
    console.error(error)
  }
}

main();
