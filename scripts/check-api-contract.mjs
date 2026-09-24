import {createHash} from "node:crypto";
import {readFileSync, readdirSync} from "node:fs";
import {join, relative, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const frontendRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const contractPath = join(frontendRoot, "openapi", "openapi.json");
const pinPath = join(frontendRoot, "openapi", "source.json");
const contractBytes = readFileSync(contractPath);
const contract = JSON.parse(contractBytes.toString("utf8"));
const pin = JSON.parse(readFileSync(pinPath, "utf8"));
const digest = createHash("sha256").update(contractBytes).digest("hex");

if (!/^[a-f0-9]{64}$/.test(pin.sha256) || pin.sha256 !== digest || pin.version !== contract.info?.version) {
  throw new Error("The pinned OpenAPI artifact differs from openapi/source.json.");
}
if (!/^1\./.test(pin.version) || !contract.openapi?.startsWith("3.")) {
  throw new Error("Expected a version 1 API contract in OpenAPI 3 format.");
}

const methods = new Map([
  ["apiGet", "get"],
  ["apiPost", "post"],
  ["apiPatch", "patch"],
  ["apiPut", "put"],
  ["apiDelete", "delete"],
  ["apiFetch", "get"],
  ["postAuth", "post"],
  ["getAuth", "get"]
]);
const errors = [];
const unresolved = [];
const forwardedPathModules = new Set(["lib/api/client.ts", "lib/auth/api.ts"]);
let checked = 0;

function* sourceFiles(directory) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* sourceFiles(path);
    } else if (/\.tsx?$/.test(entry.name)) {
      yield path;
    }
  }
}

function literalAlternatives(expression) {
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return [expression.text];
  }
  if (ts.isTemplateExpression(expression) && expression.head.text.startsWith("?")) {
    return ["?__DYNAMIC__"];
  }
  if (ts.isConditionalExpression(expression)) {
    const yes = literalAlternatives(expression.whenTrue);
    const no = literalAlternatives(expression.whenFalse);
    if (yes && no) return [...yes, ...no];
  }
  return null;
}

function requestPaths(argument) {
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return [argument.text];
  }
  if (ts.isTemplateExpression(argument)) {
    let paths = [argument.head.text];
    for (const span of argument.templateSpans) {
      const alternatives = literalAlternatives(span.expression) ?? ["__DYNAMIC__"];
      paths = paths.flatMap((path) => alternatives.map((value) => path + value + span.literal.text));
    }
    return paths;
  }
  if (ts.isCallExpression(argument) && ts.isIdentifier(argument.expression)) {
    if (argument.expression.text === "foodSearchPath") return ["/foods"];
    if (argument.expression.text === "foodDetailPath") return ["/foods/__DYNAMIC__"];
  }
  return null;
}

function requestedMethod(node, fallback) {
  if (fallback !== "get" || !ts.isIdentifier(node.expression) || node.expression.text !== "apiFetch") {
    return fallback;
  }
  const options = node.arguments[1];
  if (!options || !ts.isObjectLiteralExpression(options)) return fallback;
  const property = options.properties.find((item) =>
    ts.isPropertyAssignment(item) && item.name.getText() === "method"
  );
  return property && ts.isStringLiteral(property.initializer)
    ? property.initializer.text.toLowerCase()
    : fallback;
}

function matchesRoute(request, method) {
  if (!request.startsWith("/")) return false;
  const normalized = `/api/v1${request.split("?")[0]}`.replaceAll("__DYNAMIC__", "sample-id");
  return Object.entries(contract.paths ?? {}).some(([route, operations]) => {
    const pattern = new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{[^}]+\\\}/g, "[^/]+")}$`);
    return pattern.test(normalized) && Object.hasOwn(operations, method);
  });
}

for (const directory of ["app", "components", "lib"]) {
  for (const path of sourceFiles(join(frontendRoot, directory))) {
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && methods.has(node.expression.text)) {
        const location = `${relative(frontendRoot, path)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
        const argument = node.arguments[0];
        const paths = argument && requestPaths(argument);
        if (!paths) {
          const sourcePath = relative(frontendRoot, path);
          if (forwardedPathModules.has(sourcePath) && argument && ts.isIdentifier(argument) && argument.text === "path") {
            unresolved.push(location);
          } else {
            errors.push(`${location}: computed path needs an explicit contract mapping`);
          }
        } else {
          const method = requestedMethod(node, methods.get(node.expression.text));
          for (const pathText of paths) {
            checked++;
            if (!matchesRoute(pathText, method)) errors.push(`${location}: ${method.toUpperCase()} ${pathText}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
}

if (checked < 100) {
  errors.push(`Only ${checked} direct API calls were checked; expected at least 100.`);
}
if (errors.length) {
  console.error("Frontend API calls missing from the pinned backend contract:\n" + errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${checked} direct frontend API calls against API ${pin.version} (${pin.sha256.slice(0, 12)}).`);
  console.log(`${unresolved.length} forwarding calls use paths checked at their callers: ${unresolved.join(", ") || "none"}.`);
}
