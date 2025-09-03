import { writeFileSync, readFileSync, existsSync } from "fs";
import * as prettier from "prettier";

/**
 * Writes a file with change detection, only updating if content has actually changed
 * @param filePath - Path to the file to write
 * @param description - Description for the file (e.g., "This file contains available liquidity sources for 0x DEX integration")
 * @param codeContent - The actual code content (without timestamp)
 * @returns true if the file was updated, false if no changes were detected
 */
export async function writeFileWithChangeDetection(
  filePath: string,
  description: string,
  codeContent: string
): Promise<boolean> {
  const timestampComment = `// Auto-generated file. Do not edit manually.
// Generated on ${new Date().toISOString()}
// ${description}

`;
  const formattedCode = await prettier.format(codeContent, {
    parser: "typescript",
  });
  const fullContent = timestampComment + formattedCode;

  if (existsSync(filePath)) {
    const existingContent = readFileSync(filePath, "utf8");

    // Extract the code part from existing content (skip timestamp comment)
    // Look for the first non-comment line and take everything from there
    const existingCodeMatch = existingContent.match(
      /^(?:\s*\/\/.*\n?)*\s*([\s\S]*)$/
    );
    const existingCode = existingCodeMatch ? existingCodeMatch[1] : "";

    if (existingCode !== formattedCode) {
      writeFileSync(filePath, fullContent);
      console.log(`✅ Updated: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes detected: ${filePath}`);
      return false;
    }
  } else {
    writeFileSync(filePath, fullContent);
    console.log(`✅ Generated: ${filePath}`);
    return true;
  }
}
