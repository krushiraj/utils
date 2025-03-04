// TODO:
// btw in case you want to use a library, we are already doing this in backend:

// const results = deepDiff.diff(firstUserData, secondUserData);

const fs = require("fs");

function compareJSON(obj1, obj2, path = "") {
  const differences = [];

  if (obj1 === obj2) return differences;

  if (typeof obj1 !== typeof obj2) {
    differences.push({
      path,
      type: "type_mismatch",
      value1: typeof obj1,
      value2: typeof obj2,
    });
    return differences;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      differences.push({
        path,
        type: "array_length_mismatch",
        value1: obj1.length,
        value2: obj2.length,
      });
    }

    for (let i = 0; i < Math.max(obj1.length, obj2.length); i += 1) {
      const diff = compareJSON(obj1[i], obj2[i], `${path}[${i}]`);
      if (diff.length) differences.push(...diff);
    }
    return differences;
  }

  if (
    typeof obj1 === "object" &&
    obj1 !== null &&
    typeof obj2 === "object" &&
    obj2 !== null
  ) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check for missing keys
    const missingKeys1 = keys2.filter((key) => !keys1.includes(key));
    const missingKeys2 = keys1.filter((key) => !keys2.includes(key));

    if (missingKeys1.length) {
      differences.push({ path, type: "missing_in_first", keys: missingKeys1 });
    }
    if (missingKeys2.length) {
      differences.push({ path, type: "missing_in_second", keys: missingKeys2 });
    }

    // Compare common keys
    for (const key of keys1) {
      if (keys2.includes(key)) {
        const diff = compareJSON(
          obj1[key],
          obj2[key],
          path ? `${path}.${key}` : key
        );
        if (diff.length) differences.push(...diff);
      }
    }

    return differences;
  }

  differences.push({
    path,
    type: "value_mismatch",
    value1: obj1,
    value2: obj2,
  });
  return differences;
}

function compareJSONFiles(file1Path, file2Path) {
  try {
    const json1 = JSON.parse(fs.readFileSync(file1Path, "utf8"));
    const json2 = JSON.parse(fs.readFileSync(file2Path, "utf8"));

    const differences = compareJSON(json1, json2);

    if (!differences) {
      console.log("Files are identical");
      return { identical: true };
    }

    return {
      identical: false,
      differences,
    };
  } catch (error) {
    return {
      error: true,
      message: error.message,
    };
  }
}

// Example usage:
// const result = compareJSONFiles('file1.json', 'file2.json');
// console.log(JSON.stringify(result, null, 2));

module.exports = compareJSONFiles;

// Run if this is the main module
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2 || args.length > 3) {
    console.error(
      "Usage: node compareJSONFiles.js <file1> <file2> [outputFile]"
    );
    process.exit(1);
  }

  const [file1, file2, outputFile] = args;
  const result = compareJSONFiles(file1, file2);

  result.totalDifferences = result.differences.length;

  console.log(`Total differences: ${result.totalDifferences}`);

  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`Results saved to ${outputFile}`);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}
