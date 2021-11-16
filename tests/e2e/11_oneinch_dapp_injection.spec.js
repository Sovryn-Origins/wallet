const TestUtil = require('../utils/TestUtils')
const OverviewPage = require('../Pages/OverviewPage')
const HomePage = require('../Pages/HomePage')
const PasswordPage = require('../Pages/PasswordPage')
const puppeteer = require('puppeteer')
const { expect } = require('chai')
const chalk = require('chalk')

const testUtil = new TestUtil()
const overviewPage = new OverviewPage()
const homePage = new HomePage()
const passwordPage = new PasswordPage()

let browser, page
const password = '123123123'
const dappUrl = 'https://app.1inch.io/'

describe('1Inch Dapp Injection-[mainnet,smoke]', async () => {
  beforeEach(async () => {
    browser = await puppeteer.launch(testUtil.getChromeOptions())
    page = await browser.newPage()
    await page.goto(testUtil.extensionRootUrl, { waitUntil: 'load', timeout: 60000 })
    await homePage.ScrollToEndOfTerms(page)
    await homePage.ClickOnAcceptPrivacy(page)

    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    await overviewPage.CloseWatsNewModal(page)
    if (process.env.NODE_ENV === 'mainnet') {
      await overviewPage.SelectNetwork(page, 'mainnet')
    } else {
      await overviewPage.SelectNetwork(page)
    }
    // Web3 toggle on
    await overviewPage.ClickWeb3WalletToggle(page)
    await page.waitForTimeout(1000)
    console.log(chalk.green('Web3 toggled on'))
  })
  afterEach(async () => {
    await browser.close()
  })
  it('1Inch injection - ETH', async () => {
    // // Go to 1inch app
    const dappPage = await browser.newPage()
    await dappPage.goto(dappUrl, { waitUntil: 'load', timeout: 90000 })
    try {
      await dappPage.waitForSelector('[data-id$="header.connect-wallet-button"]')
    } catch (e) {
      await testUtil.takeScreenshot(dappPage, '1inch-wallet-button-issue')
      expect(e).equals(null)
    }
    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    await dappPage.evaluate(async () => {
      window.ethereum.enable()
    })
    const connectRequestWindow = await newPagePromise
    await connectRequestWindow.waitForSelector('#ETHEREUM', { visible: true })
    await connectRequestWindow.click('#ETHEREUM')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)
    const connectedChainDetails = await dappPage.evaluate(async () => {
      const chainIDHexadecimal = await window.ethereum.request({ method: 'eth_chainId', params: [] })
      return {
        chainId: parseInt(chainIDHexadecimal, 16),
        connectedAddress: await window.ethereum.request({ method: 'eth_accounts' })
      }
    })
    expect(connectedChainDetails.chainId, 'Uniswap ethereum dapp connection issue').equals(3)
    expect(connectedChainDetails.connectedAddress[0], 'Uniswap ethereum dapp connection issue')
      .equals('0x3f429e2212718a717bd7f9e83ca47dab7956447b')
  })
  it('1Inch injection - BSC', async () => {
    // Go to 1inch app
    const dappPage = await browser.newPage()
    await dappPage.goto(dappUrl, { waitUntil: 'load', timeout: 90000 })
    try {
      await dappPage.waitForSelector('[data-id$="header.connect-wallet-button"]')
    } catch (e) {
      await testUtil.takeScreenshot(dappPage, '1inch-wallet-button-issue')
      expect(e).equals(null)
    }
    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    await dappPage.evaluate(async () => {
      window.ethereum.enable()
    })
    const connectRequestWindow = await newPagePromise
    await connectRequestWindow.waitForSelector('#BSC', { visible: true })
    await connectRequestWindow.click('#BSC')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)
    const connectedChainDetails = await dappPage.evaluate(async () => {
      const chainIDHexadecimal = await window.ethereum.request({ method: 'eth_chainId', params: [] })
      return {
        chainId: parseInt(chainIDHexadecimal, 16),
        connectedAddress: await window.ethereum.request({ method: 'eth_accounts' })
      }
    })
    expect(connectedChainDetails.chainId, 'Uniswap bsc dapp connection issue').equals(97)
    expect(connectedChainDetails.connectedAddress[0], 'Uniswap bsc dapp connection issue')
      .equals('0x3f429e2212718a717bd7f9e83ca47dab7956447b')
  })
})
