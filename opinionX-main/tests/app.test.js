/**
 * UI Integration and Interaction Tests for opinionX App
 */

const fs = require('fs');
const path = require('path');

// Read source files
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('opinionX Application UI Integration', () => {
  let dom;
  let document;
  let window;

  beforeEach(() => {
    // Setup Mock LocalStorage
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; }),
      };
    })();
    
    // Set up mock JSDOM window objects
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });

    // Mock Chart.js constructor
    global.Chart = jest.fn().mockImplementation(() => ({
      destroy: jest.fn(),
      update: jest.fn()
    }));

    // Inject HTML content into JSDOM environment
    document = window.document;
    document.documentElement.innerHTML = htmlContent;

    // Load App Logic by executing local scripts
    // Mock the DOM Content Loaded bindings manually or require files
    global.analyzeComment = require('../sentiment').analyzeComment;
    
    // Execute app script
    require('../app');

    // Trigger DOMContentLoaded
    const event = document.createEvent('Event');
    event.initEvent('DOMContentLoaded', true, true);
    document.dispatchEvent(event);
  });

  afterEach(() => {
    jest.resetModules();
  });

  test('should boot and route to empty landing screen by default', () => {
    const activeScreens = document.querySelectorAll('.screen.active');
    expect(activeScreens).toHaveLength(1);
    expect(activeScreens[0].id).toBe('screen-empty');
  });

  test('should navigate between screens using goScreen() function', () => {
    const app = require('../app');
    
    // Switch to input screen
    app.goScreen('input');
    expect(document.getElementById('screen-input').classList.contains('active')).toBe(true);
    expect(document.getElementById('screen-empty').classList.contains('active')).toBe(false);
    expect(document.getElementById('nav-analyze').classList.contains('active')).toBe(true);

    // Switch to history screen
    app.goScreen('history');
    expect(document.getElementById('screen-history').classList.contains('active')).toBe(true);
    expect(document.getElementById('nav-history').classList.contains('active')).toBe(true);
  });

  test('should count lines in textarea on input event', () => {
    const ta = document.getElementById('demoTextarea');
    const cc = document.getElementById('charCount');

    ta.value = "Line 1\nLine 2\nLine 3";
    
    // Dispatch input event
    const event = document.createEvent('Event');
    event.initEvent('input', true, true);
    ta.dispatchEvent(event);

    expect(cc.textContent).toBe('3 comments detected');
  });

  test('should run analysis and compile metrics successfully', () => {
    const app = require('../app');
    
    const textData = "I love this smooth app!\nTerrible response time, so slow.\nIt works okay, nothing special.";
    document.getElementById('demoTextarea').value = textData;
    
    // Execute analysis logic directly
    app.runAnalysisOnText(textData);

    expect(app.currentBatchData).toHaveLength(3);
    
    // Assert sentiment ratings
    expect(app.currentBatchData[0].sentiment).toBe('Positive');
    expect(app.currentBatchData[1].sentiment).toBe('Negative');
    expect(app.currentBatchData[2].sentiment).toBe('Neutral');
  });

  test('should enable user to manually edit and override sentiment classifications', () => {
    const app = require('../app');
    const textData = "It works okay, nothing special.";
    
    // Analyze comment (initializes currentBatchData)
    app.runAnalysisOnText(textData);
    expect(app.currentBatchData[0].sentiment).toBe('Neutral');

    // Execute override to Positive
    // Mock openDetail index to 0
    document.getElementById('resultsBody').innerHTML = '<tr><td><button id="test-chevr" onclick="openDetail(0)"></button></td></tr>';
    
    // Perform Override
    app.overrideSentiment('Positive');

    expect(app.currentBatchData[0].sentiment).toBe('Positive');
    expect(app.currentBatchData[0].confidence).toBe(100);
    expect(app.currentBatchData[0].isOverridden).toBe(true);
  });

  test('should parse CSV formats correctly', () => {
    const app = require('../app');
    const csvContent = "comment,rating\nGreat product and friendly support,5\nSlow service and clunky redesign,1";
    
    const parsed = app.parseCSVText(csvContent);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toBe('Great product and friendly support');
    expect(parsed[1]).toBe('Slow service and clunky redesign');
  });
});
