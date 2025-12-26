# Code Quality & Automation

## Pre-commit Hooks

Implemented comprehensive pre-commit hooks to ensure code quality before commits reach the repository.

**Configuration:** `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.3.4
    hooks:
      - id: ruff          # Linter with auto-fix
      - id: ruff-format   # Code formatter
  - repo: https://github.com/pre-commit/pre-commit-hooks
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-merge-conflict
```

**Benefits:**
- ✅ Automatic code formatting and linting
- ✅ Prevents common mistakes (trailing whitespace, merge conflicts)
- ✅ Enforces consistent code style across the team
- ✅ Catches issues before CI/CD pipeline

**Impact:** Reduces code review time and ensures consistent code quality across all commits.

---

## Code Quality Tools

### Ruff Linter & Formatter

Ruff is used as both a linter and formatter, providing:
- **Fast Performance:** Written in Rust, 10-100x faster than alternatives
- **Auto-fix:** Automatically fixes many linting issues
- **Comprehensive Rules:** Catches bugs, enforces style, and improves code quality

### Pre-commit Hook Checks

- **Trailing Whitespace:** Removes unnecessary whitespace
- **End of File Fixer:** Ensures files end with newline
- **YAML Checker:** Validates YAML syntax
- **Large File Checker:** Prevents accidentally committing large files (>1MB)
- **Merge Conflict Checker:** Detects unresolved merge conflicts

---

## Integration with Development Workflow

Pre-commit hooks run automatically on every commit:

```bash
# When you commit, hooks run automatically
git commit -m "feat: add new feature"
# → Ruff linter runs
# → Ruff formatter runs
# → All other checks run
# → If any fail, commit is blocked
```

**Developer Experience:**
- Immediate feedback on code quality
- No need to remember to run linters manually
- Consistent code style across all contributors
- Prevents common mistakes from reaching the repository

---

## API Documentation with drf-to-mkdoc

The project uses `drf-to-mkdoc` to automatically generate comprehensive API documentation from Django REST Framework code.

### Configuration

**Settings:** `backend/config/settings.py`

```python
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_to_mkdoc.utils.schema.AutoSchema",
    # ... other settings
}

DRF_TO_MKDOC = {
    "DJANGO_APPS": [
        "players",
        "pokemon",
    ],
    "DOCS_DIR": "docs",
}
```

### Generated Documentation

`drf-to-mkdoc` automatically generates:

1. **Endpoint Documentation** (`docs/endpoints/`)
   - Complete API endpoint reference
   - Request/response schemas
   - Authentication requirements
   - Query parameters and filtering options

2. **Model Documentation** (`docs/models/`)
   - Detailed model field documentation
   - Relationships between models
   - Model methods and properties

3. **Model Relations** (`docs/models/relations.md`)
   - Visual representation of model relationships
   - Foreign key and many-to-many relationships
   - Cross-app model connections

4. **App Design** (`docs/models/design.md`)
   - Design overview for each Django app
   - App structure and organization
   - Model architecture per app

### Benefits

- ✅ **Automatic Updates:** Documentation stays in sync with code changes
- ✅ **Comprehensive Coverage:** All endpoints and models are documented
- ✅ **Interactive Examples:** Includes request/response examples
- ✅ **Schema Validation:** Shows exact data structures
- ✅ **No Manual Maintenance:** Reduces documentation drift

### Usage

Documentation is automatically generated when running:

```bash
# Generate documentation
python manage.py generate_docs

# Or build MkDocs site
mkdocs build
```

The generated documentation is accessible at:
- **MkDocs Site:** `http://localhost/api/docs/`
- **API Endpoints:** `http://localhost/api/docs/endpoints/`
- **Models:** `http://localhost/api/docs/models/`
- **Model Relations:** `http://localhost/api/docs/models/relations/`
- **App Design:** `http://localhost/api/docs/models/design/`
