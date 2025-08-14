#!/usr/bin/env python3
import re

# Read the test file
with open('src/lib/__tests__/inventory.form.validation.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find selectOptions without waitForCategoriesToLoad before it
pattern = r'(await user\.type\([^\n]+\);)\n(\s+)(await user\.selectOptions\(screen\.getByLabelText\(\'အမျိုးအစား \*\'\), \'cat1\'\);)'

# Replacement pattern
replacement = r'\1\n\2await waitForCategoriesToLoad();\n\2\3'

# Apply the replacement
new_content = re.sub(pattern, replacement, content)

# Write back to file
with open('src/lib/__tests__/inventory.form.validation.test.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed test file")
