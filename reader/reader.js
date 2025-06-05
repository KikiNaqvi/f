console.log("Sparx Reader Script loaded!");

// === CONFIGURATION ===
const targetText = "SparxCheat";
const webhookURL = "https://discord.com/api/webhooks/1376885827388440587/I3xbltmSTBzTxSXt7uqFHmMZoLjhNe2iAE6LhdE32YhW40eJ_gfC0_BTmKrshcCnRd73";
let username = null;

function findUsername() {
  const usernameInterval = setInterval(() => {
    const nameDivs = document.querySelectorAll('div');
    if (nameDivs.length > 9 && nameDivs[9].textContent.trim() !== "" && nameDivs[9].textContent.trim() !== "Log in") {
      username = nameDivs[9].textContent.trim();
      console.log("Username found:", username);
      clearInterval(usernameInterval); // Stop the interval once username is found
      // Start scanning and reporting after finding the username
      startScanning();
    } else {
      console.log("Username not yet found. Retrying...");
    }
  }, 1000); // Check every 1 second
}

// === FUNCTION TO SCAN AND REPORT ===
let lastReportTime = 0; // Make sure this is declared outside the function!

function scanDivsAndReport() {
  const nameDivs = document.querySelectorAll('div');
  nameDivs.forEach(div => {
    if (div.textContent.includes(targetText)) {
      const now = new Date();
      const timestamp = now.toLocaleString();
      const currentTime = now.getTime();

      if (currentTime - lastReportTime >= 1000) {
        const embed = {
          title: "⚠️ SparxCheat Alert!",
          description: `**${username}** used **${targetText} - Reader**`,
          color: 0xff0000, // Bright red color to grab attention
          timestamp: now.toISOString(),
          footer: {
            text: "SparxCheat Detector Bot",
            icon_url: "https://i.imgur.com/AfFp7pu.png" // Optional little icon for flair
          },
          fields: [
            {
              name: "User Mention",
              value: `<@&1375875762841849946>`, // Role ping
              inline: true
            },
            {
              name: "Time Detected",
              value: timestamp,
              inline: true
            }
          ]
        };

        const message = {
          content: `<@&1375875762841849946>`, // Role ping outside embed to trigger notifications
          embeds: [embed]
        };

        // 📨 SEND TO DISCORD
        fetch(webhookURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(message)
        })
        .then(response => {
          if (response.ok) {
            console.log("📨 Embed message successfully sent to Discord!");
          } else {
            console.error("❌ Discord rejected the embed message:", response.statusText);
          }
        })
        .catch(error => {
          console.error("⚠️ Error while sending embed to Discord:", error);
        });

        lastReportTime = currentTime;
      } else {
        console.log("⏳ Throttling message to Discord");
      }
    }
  });
}


function startScanning() {
    scanDivsAndReport(); // Initial scan
}

// Initially check for the username and then set an interval
findUsername(); // Initial check

const API_KEY = "AIzaSyD3BqxlEmUfvJ3sUGlSwixSzBWBzQ1eFdA";

let copiedText = '';
let lastEnterPress = 0;
let autoAnswerCount = 0;

setInterval(() => {
  const url = window.location.href;
  if (url.includes('/library') || url.includes('/task')) {
    ['next', 'continue', 'retry', 'start', 'continue reading', 'keep trying', 'yes, ask me the questions.'].forEach(buttonText => clickButton(buttonText));
  }
}, 200);

const beginButton = document.getElementById('manualWrapper');

if (beginButton) {
  beginButton.addEventListener('click', () => {

    checkForQs()
  });
}

let autoSliderInterval;

const stopAutoBtn = document.getElementById('stopAutoBtn');

autoBtn.addEventListener('click', () => {
  if (autoSliderInterval) {
    clearInterval(autoSliderInterval);
    console.log("🧼 Previous auto-check loop cleared.");
  }

  const delaySeconds = parseFloat(slider.value);

  autoSliderInterval = setInterval(() => {
    if (!questionAndOptionsExist()) {
      console.log(`🔍 No questions found. Retrying checkForQs() in ${delaySeconds} seconds...`);
      checkForQs();
    } else {
      console.log("🟢 Questions visible. checkForQs() loop paused.");
    }
  }, delaySeconds * 1000);
});

stopAutoBtn.addEventListener('click', () => {
  if (autoSliderInterval) {
    clearInterval(autoSliderInterval);
    autoSliderInterval = null;
    console.log("🛑 Auto-check loop manually stopped.");
    bottomText.textContent = "Auto loop stopped ❌";
  } else {
    console.log("⚠️ Tried to stop auto-check, but it wasn't running.");
  }
});

let autoAnswerCallCount = 0; // 🧠 Stays outside to persist across calls

let answerLoopInterval = null;
let wasQuestionVisible = false; // To track whether the question was visible previously
let cachedText = null;
let isAnswering = false; // To track if answering is in progress

function questionAndOptionsExist() {

  const questionDiv = Array.from(document.querySelectorAll('h2 > div')).find(div => {
    const text = div.innerText.trim();
    return (text.includes('?') || text.includes('.')) && text.length < 500;
  });

  const optionButtons = Array.from(document.querySelectorAll('button')).filter(button => {
    const text = button.querySelector('div')?.textContent.trim();
    const badTexts = ["Settings", "Feedback", "Cookie Settings", "Sign out", "I have read up to here"];
    return text && !badTexts.includes(text);
  });

  return questionDiv && optionButtons.length >= 2;
}

// 🧠 Fetch contentDiv text and store it in cache
function fetchReadingContext() {
  const candidates = Array.from(document.querySelectorAll('div')).filter(div =>
    div.textContent.includes('Start reading here')
  );

  let bestDiv = null;
  let maxParagraphs = 0;

  candidates.forEach(div => {
    const paragraphs = div.querySelectorAll('p');
    if (paragraphs.length > maxParagraphs) {
      maxParagraphs = paragraphs.length;
      bestDiv = div;
    }
  });

  cachedText = bestDiv
    ? Array.from(bestDiv.querySelectorAll('p')).map(p => p.textContent.trim()).join(' ')
    : null;

  console.log("📚 Cached text updated:", cachedText);
}

async function autoAnswer() {

  // Proceed with the normal question answering
  const questionData = extractQuestionAndOptions();
  if (!questionData) {
    console.log("❌ Could not extract question/options.");
    return;
  }

  const { question, options, optionElements } = questionData;

  if (!cachedText) {
    console.log("📭 No cached reading text!");
    return;
  }

  console.log("❓ Question:", question);
  console.log("🔘 Options:", options);

  const answer = await queryGemini(question, options, cachedText);
  bottomText.innerText = answer;
  if (!answer) {
    console.log("🤷 Gemini returned nothing.");
    return;
  }

  const matchIndex = options.findIndex(opt =>
    opt.toLowerCase().includes(answer.toLowerCase())
  );

  if (matchIndex !== -1) {
    optionElements[matchIndex].click();
    console.log(`✅ Clicked: ${options[matchIndex]}`);
  } else {
    console.log("🤷‍♂️ No option matched.");
  }
}

// 👀 Watch for the question visibility and manage caching
function monitorQuestion() {
  let wasQuestionVisible = false;

  setInterval(() => {
    const isVisible = questionAndOptionsExist();

    if (isVisible && !wasQuestionVisible) {
      // If question and options are visible, update flag and cache content if necessary
      console.log("🟢 Question and options found! Proceeding with the auto-answering loop.");
      if (!cachedText) {
        fetchReadingContext();
      }
      wasQuestionVisible = true;
    }

    if (!isVisible && wasQuestionVisible) {
      // If question and options are no longer visible, stop auto-answering and clear cache
      console.log("🔴 Question and options no longer visible. Stopping the loop.");
      wasQuestionVisible = false;
    }
  }, 1000); // Check every second
}

// 🤖 Auto answer logic
async function checkForQs() {
  // Check if the question and options exist before processing
  if (!questionAndOptionsExist()) {
    // If the questions/options are not visible, fetch the content text
      console.log("📖 Question and options not found, fetching reading context...");
      fetchReadingContext();
  }

  clickButton('i have read up to here');

    let intervalId = setInterval(() => {
      if (questionAndOptionsExist()) {
      autoAnswer();
      } else {
      clearInterval(intervalId);
      console.log("Questions and options disappeared. Stopping auto-answer attempts.");
      }
    }, 1000);
}

// 🚀 INIT
monitorQuestion();

function extractQuestionAndOptions() {
  const questionElement = Array.from(document.querySelectorAll('h2 > div')).find(div => {
    const text = div.innerText.trim();
    const isShortEnough = text.length < 500; // You can tweak this!
    const hasPunctuation = text.includes('?') || text.includes('.');
    return hasPunctuation && isShortEnough;
  });

  if (!questionElement) {
    console.warn("⚠️ No question element found!");
    return null;
  }

  const badTexts = ["Settings", "Feedback", "Cookie Settings", "Sign out", "I have read up to here"];
  const optionElements = Array.from(document.querySelectorAll('button')).filter(button => {
    const text = button.querySelector('div')?.textContent.trim();
    return text && !badTexts.includes(text);
  });

  const question = questionElement.innerText.trim();
  const options = optionElements.map(option => option.innerText.trim());

  return { question, options, optionElements };
}

// Unified button click function
const clickButton = (buttonText) => {
  const button = [...document.querySelectorAll('button')].find(btn => btn.textContent.trim().toLowerCase() === buttonText);
  if (button) {
    button.click();
    return true;
  }
  return false;
};

// Query Gemini API
async function queryGemini(question, options, context) {
  const prompt = `You are given the following context and question. Select the single most relevant answer from the provided options. Do not generate anything outside of the specified options. Do not explain. Return exactly one answer string. Context: ${context} Question: ${question} Options: ${options.join(', ')} Respond with only one of the exact options listed above. Answer:`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "contents": [{ "parts": [{ "text": prompt }] }] })
    });

    if (!response.ok) {
      console.error("Gemini API Error:", response.statusText);
      return null;
    }

    const data = await response.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log("Gemini Response:", data);
    return answer || "No answer found";

  } catch (error) {
    console.error("Gemini API Fetch Error:", error);
    return null;
  }
}