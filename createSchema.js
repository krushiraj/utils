const fs = require('fs');

// Function to determine the type of a value
const getType = value => {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
};

// Function to merge schemas
const mergeSchemas = (schema1, schema2) => {
  const merged = { ...schema1 };

  Object.keys(schema2).forEach(key => {
    if (!(key in merged)) {
      merged[key] = schema2[key];
      return;
    }

    const mergedKey = merged[key];
    const schema2Key = schema2[key];

    if (mergedKey.type === 'object' && schema2Key.type === 'object') {
      mergedKey.properties = mergeSchemas(mergedKey.properties, schema2Key.properties);
    } else if (mergedKey.type === 'array' && schema2Key.type === 'array') {
      mergedKey.items = mergeSchemas(mergedKey.items || {}, schema2Key.items || {});
    } else {
      const types = new Set([mergedKey.type, schema2Key.type]);
      mergedKey.type = Array.from(types).join('|');
    }
  });

  return merged;
};

// Function to generate schema for a single object
const generateSchema = data => {
  const schema = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    const type = getType(value);

    if (type === 'object') {
      schema[key] = {
        type: 'object',
        properties: generateSchema(value),
      };
    } else if (type === 'array') {
      schema[key] = {
        type: 'array',
        items: value.length > 0 ? generateSchema(value[0]) : {},
      };
    } else {
      schema[key] = { type };
    }
  });

  return schema;
};

// Main function to build the schema
const buildSchema = dataArray => {
  let finalSchema = {};
  let count = 0;
  const total = dataArray.length;

  for (const data of dataArray) {
    const schema = generateSchema(data);
    finalSchema = mergeSchemas(finalSchema, schema);
    count += 1;
    if (count % 1000 === 0) console.log(`Processed ${count} of ${total} objects`);
  }

  return finalSchema;
};

// Get filename from command line arguments
const filename = process.argv[2];
if (!filename) {
  console.error('Please provide a filename as argument');
  process.exit(1);
}

const data = fs
  .readFileSync(filename, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map(json => JSON.parse(json));

const outputFile = filename.replace(/\.jsonl?$/, '-schema.json');
const schema = buildSchema(data);
fs.writeFileSync(outputFile, JSON.stringify(schema, null, 2));
console.log(`Schema generated and saved to ${outputFile}`);
