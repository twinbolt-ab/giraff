#!/bin/bash
# Generates SEO-optimized changelog summaries for the web using the SEO visibility expert agent
# Usage: ./scripts/generate-seo-changelog.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CHANGELOG_FILE="$PROJECT_DIR/CHANGELOG.md"
OUTPUT_FILE="$PROJECT_DIR/web/src/content/changelog.json"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

cd "$PROJECT_DIR"

echo -e "${CYAN}Reading CHANGELOG.md...${NC}"

echo -e "${CYAN}Generating SEO-optimized changelog with SEO visibility expert...${NC}"

# Build the prompt in a temp file to avoid shell expansion issues
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" << 'PROMPT_HEADER'
You are the SEO visibility expert for Stuga, a Home Assistant dashboard app.

## Your Task
Convert this CHANGELOG.md into a JSON format optimized for web SEO. Each release needs:
1. `summary` - The original user-friendly summary (keep as-is from the markdown)
2. `seoSummary` - An SEO-optimized version that naturally includes keywords

## SEO Keywords to Include (where relevant)
- "Home Assistant" - MUST appear in most seoSummary entries
- "dashboard", "smart home", "mobile app"
- Device types: lights, sensors, switches, climate, temperature, humidity
- Platforms: iOS, Android
- Actions: control, manage, organize, customize

## Stuga's Differentiators (emphasize when relevant)
- Mobile-first design
- No YAML configuration needed
- Real-time updates
- Touch-friendly interface
- Scandinavian minimal aesthetic

## Output Format
Return ONLY valid JSON (no markdown, no explanation, no preamble):
{
  "releases": [
    {
      "version": "X.X.X",
      "date": "YYYY-MM-DD",
      "summary": "original summary from changelog",
      "seoSummary": "SEO-optimized version with keywords",
      "sections": [
        { "title": "Category", "items": ["item1", "item2"] }
      ]
    }
  ]
}

## Rules for seoSummary
- Keep it natural and readable - no keyword stuffing
- 1-2 sentences max
- Start with action words when possible
- Include "Home Assistant" in at least 80% of entries
- Mention specific device types when the release relates to them

## CHANGELOG.md Content:
PROMPT_HEADER

# Append the changelog content literally (no shell expansion)
cat "$CHANGELOG_FILE" >> "$PROMPT_FILE"

echo "" >> "$PROMPT_FILE"
echo "Generate the JSON now:" >> "$PROMPT_FILE"

# Generate with Claude using stdin to avoid shell expansion issues
RAW_OUTPUT=$(claude -p < "$PROMPT_FILE")
rm -f "$PROMPT_FILE"

# Check for empty output
if [[ -z "$RAW_OUTPUT" ]]; then
  echo -e "${RED}Error: Claude returned empty output${NC}"
  exit 1
fi

# Extract JSON object from output (strips code fences, preamble text, etc.)
JSON_OUTPUT=$(echo "$RAW_OUTPUT" | python3 -c "
import sys
text = sys.stdin.read()
start = text.find('{')
end = text.rfind('}')
if start >= 0 and end >= 0:
    print(text[start:end+1])
")

# Validate JSON and write
if echo "$JSON_OUTPUT" | python3 -m json.tool > /dev/null 2>&1; then
  echo "$JSON_OUTPUT" > "$OUTPUT_FILE"
  echo -e "${GREEN}Generated $OUTPUT_FILE${NC}"

  # Count releases
  RELEASE_COUNT=$(echo "$JSON_OUTPUT" | python3 -c "import json,sys; print(len(json.load(sys.stdin)['releases']))")
  echo -e "${GREEN}Contains $RELEASE_COUNT releases with SEO-optimized summaries${NC}"
else
  echo -e "${RED}Error: Claude output is not valid JSON${NC}"
  echo "Raw output was:"
  echo "$RAW_OUTPUT" | head -20
  exit 1
fi
