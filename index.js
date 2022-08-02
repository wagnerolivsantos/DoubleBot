"use strict";

require("dotenv").config();
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const url = process.env.SITE;

(async () => {
  let $,
    connectionStatus,
    roulette,
    rouletteHeader,
    round,
    counter = 0,
    lastRouletteCode = "";

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--start-maximized"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url);

    const robot = setInterval(async () => {
      connectionStatus = await page.evaluate(() => {
        return navigator.onLine;
      });

      if (connectionStatus) {
        if (counter > 0) page.reload();

        $ = cheerio.load(
          await page.evaluate(() => {
            return document.documentElement.innerHTML;
          })
        );

        if (rouletteStatus($)) {
          roulette = $(".sm-box");

          if (roulette.length > 0) {
            try {
              await page.click(
                `.${roulette[0].attribs.class.replace(" ", ".")}`
              );

              await page.waitForSelector(".modal-portal .header h1");

              rouletteHeader = await page
                .$eval(
                  ".modal-portal .header h1",
                  (element) => element.innerText
                )
                .then((element) => {
                  return element.split(" ")[0];
                });

              if (rouletteHeader == "Histórico") await page.goBack();

              if (rouletteHeader == "Rodada") {
                await page.waitForSelector(".modal-portal .header h2");

                round = await page
                  .$eval(
                    ".modal-portal .header h2",
                    (element) => element.innerText
                  )
                  .then((element) => {
                    return [
                      element.split(" ")[0].replace("#", ""),
                      element.split(" ")[3],
                      `${element.split(" ")[4]} ${element.split(" ")[5]}`,
                      settingColor($, roulette[0]),
                      settingNumber(
                        $,
                        roulette[0],
                        settingColor($, roulette[0])
                      ),
                    ];
                  });

                if (!rouletteCodeExists(round[0], lastRouletteCode)) {
                  lastRouletteCode = round[0];

                  consoleMessage(
                    `[ ${round[0]}, ${round[1]}, ${round[2]},${round[3]}  ${round[4]} ]`
                  );
                }

                await page.goBack();
              }
            } catch {
              await page.reload();
            }
          } else {
            consoleMessage("❌  No rounds captured!!!");
            await page.reload();
          }
        } else counter = 0;
      } else {
        counter++;
        await page.reload();

        if (counter == process.env.MAXIMUM_RECONNECTION) {
          consoleMessage("💀  OFFLINE");
          clearInterval(robot);
          await browser.close();
        }
      }
    }, process.env.ROBOT_TIME);
  } catch {
    browser.close();
  }
})();

function consoleMessage(message) {
  console.log(`❱ ${message}`);
}

function rouletteCodeExists(recentRouletteCode, lastRouletteCode) {
  return recentRouletteCode == lastRouletteCode ? true : false;
}

function rouletteStatus($) {
  if ($("#roulette").hasClass("complete") || $("#roulette").hasClass("waiting"))
    return true;
  return false;
}

function settingColor($, rouletteSpin) {
  if ($(rouletteSpin).hasClass("black")) return "⚫";
  else if ($(rouletteSpin).hasClass("red")) return "🔴";
  return "⚪";
}

function settingNumber($, rouletteSpin, color) {
  if (color == "⚪") return 0;
  return parseInt($(rouletteSpin).text());
}
