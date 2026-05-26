import os
import re
import subprocess
import sys

def check_npm_test():
    """Attempts to run the Jest tests via npm test."""
    print("Checking for npm and node to run Jest automated tests...")
    try:
        # Check node availability
        res_node = subprocess.run(["node", "-v"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res_node.returncode == 0:
            print(f"Node.js found: {res_node.stdout.strip()}")
            print("Executing 'npm test'...")
            res_test = subprocess.run(["npm", "test"], stdout=sys.stdout, stderr=sys.stderr, shell=True)
            return res_test.returncode == 0
    except FileNotFoundError:
        pass
    
    print("Node.js/npm command was not found in PATH.")
    print("Falling back to Python-based static code validation & DOM linkage tests...\n")
    return None

def run_python_validation():
    """Runs a suite of structural, syntax, and DOM linkage validation checks."""
    print("==================================================")
    print(" Running Sentix Python Static & DOM Linkage Suite ")
    print("==================================================")
    
    passed_tests = 0
    failed_tests = 0
    
    def log_result(test_name, success, message=""):
        nonlocal passed_tests, failed_tests
        if success:
            print(f"[PASS] {test_name}")
            passed_tests += 1
        else:
            print(f"[FAIL] {test_name}")
            if message:
                print(f"    Error: {message}")
            failed_tests += 1

    # Test 1: File Integrity check
    required_files = [
      'index.html', 'styles.css', 'sentiment.js', 'app.js', 
      'test_runner.html', 'tests/sentiment.test.js', 'tests/app.test.js'
    ]
    missing_files = [f for f in required_files if not os.path.exists(f)]
    log_result(
        "File Integrity (Check if all core and test assets exist)",
        len(missing_files) == 0,
        f"Missing files: {', '.join(missing_files)}" if missing_files else ""
    )

    # Test 2: Lexicon Parsing & Validation in sentiment.js
    lexicon_valid = True
    lexicon_error = ""
    try:
        with open('sentiment.js', 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract SENTIMENT_LEXICON block
            lex_match = re.search(r'const SENTIMENT_LEXICON = \{([\s\S]*?)\};', content)
            if not lex_match:
                lexicon_valid = False
                lexicon_error = "Could not find SENTIMENT_LEXICON dictionary declarations in sentiment.js"
            else:
                lex_str = lex_match.group(1)
                # Find all word entries and scores e.g., 'love': 4,
                entries = re.findall(r"['\"](\w+['\"]?\w*)['\"]\s*:\s*(-?\d+)", lex_str)
                if len(entries) < 100:
                    lexicon_valid = False
                    lexicon_error = f"Lexicon contains too few items ({len(entries)}), expected ~150"
                else:
                    # Check scores are bounds
                    for word, score in entries:
                        score_val = int(score)
                        if score_val < -5 or score_val > 5:
                            lexicon_valid = False
                            lexicon_error = f"Word '{word}' has out of bounds score: {score_val}"
                            break
    except Exception as e:
        lexicon_valid = False
        lexicon_error = str(e)
    log_result("Lexicon Integrity (Verify parser dictionary formats and bounds)", lexicon_valid, lexicon_error)

    # Test 3: Static DOM Linkage Verification (app.js document queries exist in index.html)
    dom_linkage_valid = True
    dom_linkage_errors = []
    try:
        # Read index.html to find all defined IDs
        with open('index.html', 'r', encoding='utf-8') as f:
            html = f.read()
            defined_ids = set(re.findall(r'id=["\'](\w+[-\w]*)["\']', html))
            # Also catch class names and general selectors if possible
            defined_classes = set(re.findall(r'class=["\']([\w\s-]+)["\']', html))
            all_classes = set()
            for c_str in defined_classes:
                all_classes.update(c_str.split())

        # Read app.js to find document.getElementById and querySelector calls
        with open('app.js', 'r', encoding='utf-8') as f:
            js = f.read()
            # Find document.getElementById('...') or "..."
            get_id_calls = re.findall(r'document\.getElementById\([\'"](\w+[-\w]*)[\'"]\)', js)
            for element_id in get_id_calls:
                if element_id not in defined_ids:
                    dom_linkage_errors.append(f"Element ID '{element_id}' requested in app.js is missing in index.html")
            
            # Find querySelector requests referencing IDs e.g. querySelector('#...')
            query_id_calls = re.findall(r'querySelector\([\'"]#(\w+[-\w]*)[\'"]\)', js)
            for element_id in query_id_calls:
                if element_id not in defined_ids:
                    dom_linkage_errors.append(f"Selector ID '#{element_id}' requested in app.js is missing in index.html")
                    
        if dom_linkage_errors:
            dom_linkage_valid = False
            
    except Exception as e:
        dom_linkage_valid = False
        dom_linkage_errors.append(f"Linkage parser crash: {str(e)}")

    log_result(
        "DOM Linkage Check (Ensure JavaScript requested element IDs exist in HTML markup)",
        dom_linkage_valid,
        "\n    ".join(dom_linkage_errors) if dom_linkage_errors else ""
    )

    print("\n==================================================")
    print(f" Summary: Passed {passed_tests}/3 tests. Failed {failed_tests}/3 tests.")
    if failed_tests == 0:
        print(" Success! All static code integrity checks passed.")
    print("==================================================")
    print("\n* To execute E2E interactive browser tests, run: python server.py")
    print("  and open: http://localhost:3000/test_runner.html in your browser.\n")
    
    return failed_tests == 0

if __name__ == "__main__":
    npm_result = check_npm_test()
    if npm_result is None:
        # Run fallback validation
        success = run_python_validation()
        sys.exit(0 if success else 1)
    else:
        sys.exit(0 if npm_result else 1)
