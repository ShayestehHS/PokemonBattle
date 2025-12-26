"""
Compatibility shim for coreapi on Python 3.13+ where cgi module was removed.
This file should be imported before coreapi to provide the missing cgi module.
"""

import sys

# Python 3.13+ removed the cgi module, but coreapi still needs it
if sys.version_info >= (3, 13):
    try:
        import cgi
    except ImportError:
        # Create a minimal cgi module compatibility shim
        import email.message

        class cgi:
            """Minimal cgi module compatibility shim for Python 3.13+"""

            @staticmethod
            def parse_header(value):
                """Parse a Content-Type header."""
                if not value:
                    return "", {}
                msg = email.message.EmailMessage()
                msg["Content-Type"] = value
                return msg.get_content_type(), dict(msg.get_params())

            @staticmethod
            def parse_multipart(fp, pdict):
                """Parse multipart form data."""
                # Minimal implementation - just return empty dict
                # This is only needed for coreapi's internal use
                return {}

        # Inject into sys.modules so coreapi can import it
        sys.modules["cgi"] = cgi
