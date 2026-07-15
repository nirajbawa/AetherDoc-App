import os
import sys
from typing import List, Dict
from mcp.server.fastmcp import FastMCP
from utils.compiler import compile_document_to_docx

# Create a FastMCP instance
mcp = FastMCP("Document Generator Server")

@mcp.tool()
def generate_docx_document(session_id: str, title: str, sections: List[Dict[str, str]]) -> str:
    """
    Generate a styled Word (.docx) document from structured content sections.
    
    Args:
        session_id: The unique session identifier (used for the output filename).
        title: The main title of the document.
        sections: A list of dicts containing 'heading' (e.g., "1. Executive Summary") 
                  and 'content' (the paragraph text, list items, or tables).
                  
    Returns:
        A status message indicating success and the file path, or error details.
    """
    try:
        # Compile document
        filepath = compile_document_to_docx(session_id, title, sections)
        abs_path = os.path.abspath(filepath)
        return f"Success: Document compiled and styled successfully. File saved at: {abs_path}"
    except Exception as e:
        return f"Error compiling document: {str(e)}"

if __name__ == "__main__":
    # Run the MCP server over stdio
    mcp.run()
