const fs = require("fs");
const path = require("path");

// Function to convert JSON array to SQL INSERT statements
function jsonToSql(jsonData, tableName, columns) {
  let sql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES\n`;

  const values = jsonData.map((item) => {
    const rowValues = columns.map((col) => {
      const value = item[col];
      if (value === null || value === undefined) {
        return "NULL";
      }
      if (typeof value === "string") {
        // Escape single quotes and wrap in quotes
        return `'${value.replace(/'/g, "''")}'`;
      }
      if (typeof value === "object") {
        // Convert objects to JSON string
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
      return value;
    });
    return `(${rowValues.join(", ")})`;
  });

  sql += values.join(",\n");
  sql += ";";

  return sql;
}

// Read and convert classes.json
try {
  const classesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "classes.json"), "utf8"),
  );
  const classesColumns = [
    "id",
    "nama",
    "email",
    "minatKelas",
    "nomerHp",
    "timestamp",
  ];
  const classesSql = jsonToSql(classesData, "classes", classesColumns);

  fs.writeFileSync(path.join(__dirname, "classes.sql"), classesSql);
  console.log("classes.sql generated successfully");
} catch (error) {
  console.error("Error converting classes.json:", error);
}

// Read and convert files.json
try {
  const filesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "files.json"), "utf8"),
  );
  const filesColumns = ["id", "name", "filename", "type", "size", "path"];
  const filesSql = jsonToSql(filesData, "files", filesColumns);

  fs.writeFileSync(path.join(__dirname, "files.sql"), filesSql);
  console.log("files.sql generated successfully");
} catch (error) {
  console.error("Error converting files.json:", error);
}

// Read and convert gallery.json
try {
  const galleryData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "gallery.json"), "utf8"),
  );
  const galleryColumns = ["id", "name", "filename", "type", "size", "path"];
  const gallerySql = jsonToSql(galleryData, "gallery", galleryColumns);

  fs.writeFileSync(path.join(__dirname, "gallery.sql"), gallerySql);
  console.log("gallery.sql generated successfully");
} catch (error) {
  console.error("Error converting gallery.json:", error);
}
