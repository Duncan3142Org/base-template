#!/bin/bash

#MISE description="Apply declarative hydration manifest to transform template files for a cloned repository"

#USAGE flag "--root-dir <root-dir>" {
#USAGE   required #true
#USAGE   env "WORKSPACE_DIR"
#USAGE   help "Repository root directory (files resolved relative to this)"
#USAGE }
#USAGE flag "--repo-owner <repo-owner>" {
#USAGE   required #true
#USAGE   env "GITHUB_REPOSITORY_OWNER"
#USAGE   help "Target repository owner (e.g. Duncan3142Org)"
#USAGE }
#USAGE flag "--source-repo-name <source-repo-name>" {
#USAGE   required #true
#USAGE   env "SOURCE_REPO_NAME"
#USAGE   help "Source (template) repository name"
#USAGE }
#USAGE flag "--clone-repo-name <clone-repo-name>" {
#USAGE   required #true
#USAGE   env "CLONE_REPO_NAME"
#USAGE   help "Cloned repository name"
#USAGE }

set -ueC
set -o pipefail

# --- Visual Helpers ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Inputs ---
root_dir="${usage_root_dir:?}"
repo_owner="${usage_repo_owner:?}"
source_name="${usage_source_repo_name:?}"
clone_name="${usage_clone_repo_name:?}"

# Export for env var expansion
export REPO_OWNER="$repo_owner"
export SOURCE_NAME="$source_name"
export CLONE_NAME="$clone_name"

# Restrict envsubst to only the known hydration variables
expand_vars() {
  # shellcheck disable=SC2016
  envsubst '$REPO_OWNER $SOURCE_NAME $CLONE_NAME' <<< "$1"
}

MANIFEST="${root_dir}/.github/hydrate.yml"

# --- Tool checks ---
for tool in yq comby envsubst; do
  if ! command -v "$tool" &> /dev/null; then
    echo -e "${RED}Error: '$tool' is not installed.${NC}"
    exit 1
  fi
done

# --- Manifest check ---
if [[ ! -f "$MANIFEST" ]]; then
  echo -e "${RED}Error: Hydration manifest not found at ${MANIFEST}${NC}"
  exit 1
fi

echo -e "${BLUE}🚀 Starting hydration: ${source_name} → ${clone_name}${NC}"

# --- Read transformation count ---
entry_count=$(yq eval '.transformations | length' "$MANIFEST")

for (( i=0; i<entry_count; i++ )); do
  engine=$(yq eval ".transformations[$i].engine" "$MANIFEST")

  # Expand file globs relative to root_dir using bash globstar
  mapfile -t raw_patterns < <(yq eval ".transformations[$i].files[]" "$MANIFEST")
  mapfile -t resolved_files < <(
    shopt -s globstar nullglob
    cd "$root_dir"
    IFS=
    for pattern in "${raw_patterns[@]}"; do
      for match in $pattern; do
        [[ -f "$match" || -d "$match" ]] && printf '%s\n' "$match"
      done
    done | sort -u
  )

  if [[ ${#resolved_files[@]} -eq 0 ]]; then
    echo -e "${BLUE}   ⏭️  Skipping ${engine} entry $((i+1)) — no files matched${NC}"
    continue
  fi

  case "$engine" in

    yq)
      expression=$(yq eval ".transformations[$i].expression" "$MANIFEST")
      echo -e "${BLUE}🛠️  yq: processing ${#resolved_files[@]} file(s)...${NC}"
      for file in "${resolved_files[@]}"; do
        filepath="${root_dir}/${file#./}"
        echo "   ${file}"
        yq eval -i "$expression" "$filepath"
      done
      ;;

    sed)
      replacement_count=$(yq eval ".transformations[$i].replacements | length" "$MANIFEST")
      echo -e "${BLUE}🛠️  sed: processing ${#resolved_files[@]} file(s)...${NC}"
      for file in "${resolved_files[@]}"; do
        filepath="${root_dir}/${file#./}"
        echo "   ${file}"
        for (( r=0; r<replacement_count; r++ )); do
          match_str=$(expand_vars "$(yq eval ".transformations[$i].replacements[$r].match" "$MANIFEST")")
          rewrite_str=$(expand_vars "$(yq eval ".transformations[$i].replacements[$r].rewrite" "$MANIFEST")")
          sep=$'\x01'
          sed -i "s${sep}${match_str}${sep}${rewrite_str}${sep}g" "$filepath"
        done
      done
      ;;

    comby)
      language=$(yq eval ".transformations[$i].language" "$MANIFEST")
      replacement_count=$(yq eval ".transformations[$i].replacements | length" "$MANIFEST")
      echo -e "${BLUE}🧩 comby: processing ${#resolved_files[@]} file(s)...${NC}"
      for file in "${resolved_files[@]}"; do
        filepath="${root_dir}/${file#./}"
        echo "   ${file}"
        for (( r=0; r<replacement_count; r++ )); do
          match_raw=$(yq eval ".transformations[$i].replacements[$r].match" "$MANIFEST")
          rewrite_raw=$(yq eval ".transformations[$i].replacements[$r].rewrite" "$MANIFEST")
          match_pattern=$(expand_vars "$match_raw")
          rewrite_pattern=$(expand_vars "$rewrite_raw")
          comby "$match_pattern" "$rewrite_pattern" \
            -language "$language" \
            -in-place \
            -f "$filepath"
        done
      done
      ;;

    rm)
      echo -e "${BLUE}🧹 rm: removing ${#resolved_files[@]} file(s)...${NC}"
      for file in "${resolved_files[@]}"; do
        filepath="${root_dir}/${file#./}"
        echo "   ${file}"
        rm -rf "$filepath"
      done
      ;;

    *)
      echo -e "${RED}Error: Unknown engine '${engine}' in manifest entry $((i+1))${NC}"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}✅ Hydration complete.${NC}"
