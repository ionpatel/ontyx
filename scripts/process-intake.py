#!/usr/bin/env python3
"""
Ontyx Business Intake Processor
Ion's automated system for processing new business requests

Usage:
  python3 process-intake.py check     # Check for pending requests
  python3 process-intake.py list      # List all pending
  python3 process-intake.py process   # Process next pending request
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

INTAKE_DIR = Path.home() / "ontyx" / "intake"
PENDING_DIR = INTAKE_DIR / "pending"
PROCESSED_DIR = INTAKE_DIR / "processed"
TEMPLATES_DIR = INTAKE_DIR / "templates"

def check_pending():
    """Check if there are pending requests."""
    pending = list(PENDING_DIR.glob("*.json"))
    if not pending:
        print("✅ No pending business requests")
        return 0
    print(f"⚠️ {len(pending)} pending request(s)")
    for p in pending:
        print(f"  - {p.name}")
    return len(pending)

def list_pending():
    """List all pending requests with details."""
    pending = list(PENDING_DIR.glob("*.json"))
    if not pending:
        print("No pending requests")
        return
    
    for p in pending:
        try:
            data = json.loads(p.read_text())
            biz = data.get("business", {})
            print(f"\n📋 {p.name}")
            print(f"   Business: {biz.get('name', 'Unknown')}")
            print(f"   Type: {biz.get('type', 'Unknown')}")
            print(f"   Location: {biz.get('location', 'Unknown')}")
            print(f"   Created: {data.get('created_at', 'Unknown')}")
        except Exception as e:
            print(f"   Error reading {p.name}: {e}")

def load_template(vertical: str) -> dict:
    """Load an industry vertical template."""
    template_file = TEMPLATES_DIR / f"{vertical}.json"
    if template_file.exists():
        return json.loads(template_file.read_text())
    return {}

def process_request(request_file: Path) -> dict:
    """Process a business request and return configuration."""
    data = json.loads(request_file.read_text())
    biz = data.get("business", {})
    reqs = data.get("requirements", {})
    
    # Load matching template
    vertical = reqs.get("industry_vertical", biz.get("type", "retail"))
    template = load_template(vertical)
    
    # Build configuration
    config = {
        "request_id": data.get("id"),
        "processed_at": datetime.now().isoformat(),
        "business": biz,
        "template_used": vertical,
        "modules_enabled": template.get("modules", {}).get("enabled", []),
        "features": template.get("features", {}),
        "custom_notes": reqs.get("custom_workflow", ""),
        "needs_review": False
    }
    
    # Flag for human review if custom workflow is complex
    custom = reqs.get("custom_workflow", "")
    if len(custom) > 100:
        config["needs_review"] = True
        config["review_reason"] = "Complex custom workflow needs human review"
    
    return config

def process_next():
    """Process the next pending request."""
    pending = sorted(PENDING_DIR.glob("*.json"))
    if not pending:
        print("No pending requests to process")
        return
    
    request_file = pending[0]
    print(f"Processing: {request_file.name}")
    
    try:
        config = process_request(request_file)
        
        # Save processed config
        output_file = PROCESSED_DIR / f"processed_{request_file.name}"
        output_file.write_text(json.dumps(config, indent=2))
        
        # Move original to processed
        (PROCESSED_DIR / f"original_{request_file.name}").write_text(
            request_file.read_text()
        )
        request_file.unlink()
        
        print(f"✅ Processed: {config['business'].get('name', 'Unknown')}")
        print(f"   Template: {config['template_used']}")
        print(f"   Modules: {', '.join(config['modules_enabled'])}")
        
        if config["needs_review"]:
            print(f"⚠️ NEEDS REVIEW: {config['review_reason']}")
        
    except Exception as e:
        print(f"❌ Error processing: {e}")

def main():
    # Ensure directories exist
    PENDING_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    cmd = sys.argv[1]
    
    if cmd == "check":
        check_pending()
    elif cmd == "list":
        list_pending()
    elif cmd == "process":
        process_next()
    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)

if __name__ == "__main__":
    main()
