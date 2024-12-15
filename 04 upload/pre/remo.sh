#!/bin/bash

# Loop through all files that start with a single quote and end with .pdf'
for file in "'WO"*"pdf'"; do
    # Check if file exists and matches pattern
    if [ -f "$file" ]; then
        # Remove first and last character (the quotes)
        newname="${file:1:-1}"
        # Rename the file
        mv "$file" "$newname"
        echo "Renamed: $file → $newname"
    fi
done

echo "Processing complete!"