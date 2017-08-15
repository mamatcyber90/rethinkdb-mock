var arrayEquals, assertType, hasKeys, inherits, isArray, isConstructor, objectEquals, pluckWithArray, pluckWithObject, resolve, resolveArray, resolveObject, sliceArray, typeNames, update, utils;

isConstructor = require("isConstructor");

assertType = require("assertType");

sliceArray = require("sliceArray");

hasKeys = require("hasKeys");

isArray = Array.isArray;

typeNames = {
  boolean: "BOOL",
  "function": "FUNCTION",
  number: "NUMBER",
  object: "OBJECT",
  string: "STRING"
};

utils = exports;

utils.typeOf = function(value) {
  var name;
  if (value === null) {
    return "NULL";
  }
  if (isArray(value)) {
    return "ARRAY";
  }
  if (name = typeNames[typeof value]) {
    return name;
  }
  throw Error("Unsupported value type");
};

utils.expect = function(value, expectedType) {
  var type;
  type = utils.typeOf(value);
  if (type !== expectedType) {
    throw Error("Expected type " + expectedType + " but found " + type);
  }
};

utils.isQuery = function(queryTypes, value) {
  return value && inherits(value, queryTypes);
};

utils.getField = function(value, attr) {
  if (value.hasOwnProperty(attr)) {
    return value[attr];
  }
  throw Error("No attribute `" + attr + "` in object");
};

utils.hasFields = function(value, attrs) {
  var attr, i, len;
  for (i = 0, len = attrs.length; i < len; i++) {
    attr = attrs[i];
    if (!value.hasOwnProperty(attr)) {
      return false;
    }
  }
  return true;
};

utils.equals = function(value1, value2) {
  if (isArray(value1)) {
    if (!isArray(value2)) {
      return false;
    }
    return arrayEquals(value1, value2);
  }
  if (isConstructor(value1, Object)) {
    if (!isConstructor(value2, Object)) {
      return false;
    }
    return objectEquals(value1, value2);
  }
  return value1 === value2;
};

utils.flatten = function(input, output) {
  var i, len, value;
  if (output == null) {
    output = [];
  }
  assertType(input, Array);
  assertType(output, Array);
  for (i = 0, len = input.length; i < len; i++) {
    value = input[i];
    if (isArray(value)) {
      utils.flatten(value, output);
    } else {
      output.push(value);
    }
  }
  return output;
};

utils.pluck = function(input, keys) {
  return pluckWithArray(keys, input, {});
};

utils.without = function(input, keys) {
  var key, output, value;
  output = {};
  for (key in input) {
    value = input[key];
    if (!~keys.indexOf(key)) {
      output[key] = value;
    }
  }
  return output;
};

utils.update = function(object, patch) {
  if (patch === null) {
    return false;
  }
  if ("OBJECT" !== utils.typeOf(patch)) {
    throw Error("Inserted value must be an OBJECT (got " + (utils.typeOf(patch)) + ")");
  }
  if (patch.hasOwnProperty("id")) {
    if (patch.id !== object.id) {
      throw Error("Primary key `id` cannot be changed");
    }
  }
  return !!update(object, patch);
};

utils.clone = function(value) {
  if (value === null) {
    return null;
  }
  if (isArray(value)) {
    return utils.cloneArray(value);
  }
  if (isConstructor(value, Object)) {
    return utils.cloneObject(value);
  }
  return value;
};

utils.cloneArray = function(values) {
  var clone, i, index, len, value;
  clone = new Array(values.length);
  for (index = i = 0, len = values.length; i < len; index = ++i) {
    value = values[index];
    clone[index] = utils.clone(value);
  }
  return clone;
};

utils.cloneObject = function(values) {
  var clone, key, value;
  clone = {};
  for (key in values) {
    value = values[key];
    clone[key] = utils.clone(value);
  }
  return clone;
};

utils.each = function(values, iterator) {
  var key, value;
  for (key in values) {
    value = values[key];
    iterator(value, key);
  }
};

utils.resolve = function(value, ctx) {
  if (utils.isQuery(value)) {
    return value._run(ctx);
  }
  if (ctx != null) {
    ctx.type = "DATUM";
  }
  if (isArray(value)) {
    return resolveArray(value, ctx);
  }
  if (isConstructor(value, Object)) {
    return resolveObject(value, ctx);
  }
  return value;
};

inherits = function(value, types) {
  var i, len, type;
  for (i = 0, len = types.length; i < len; i++) {
    type = types[i];
    if (value instanceof type) {
      return true;
    }
  }
  return false;
};

arrayEquals = function(array1, array2) {
  var i, index, len, value1;
  if (array1.length !== array2.length) {
    return false;
  }
  for (index = i = 0, len = array1.length; i < len; index = ++i) {
    value1 = array1[index];
    if (!utils.equals(value1, array2[index])) {
      return false;
    }
  }
  return true;
};

objectEquals = function(object1, object2) {
  var i, j, key, keys, len, len1, ref;
  keys = Object.keys(object1);
  ref = Object.keys(object2);
  for (i = 0, len = ref.length; i < len; i++) {
    key = ref[i];
    if (!~keys.indexOf(key)) {
      return false;
    }
  }
  for (j = 0, len1 = keys.length; j < len1; j++) {
    key = keys[j];
    if (!utils.equals(object1[key], object2[key])) {
      return false;
    }
  }
  return true;
};

pluckWithArray = function(array, input, output) {
  var i, key, len;
  array = utils.flatten(array);
  for (i = 0, len = array.length; i < len; i++) {
    key = array[i];
    if (isConstructor(key, String)) {
      if (input.hasOwnProperty(key)) {
        output[key] = input[key];
      }
    } else if (isConstructor(key, Object)) {
      pluckWithObject(key, input, output);
    } else {
      throw TypeError("Invalid path argument");
    }
  }
  return output;
};

pluckWithObject = function(object, input, output) {
  var key, value;
  for (key in object) {
    value = object[key];
    if (value === true) {
      if (input.hasOwnProperty(key)) {
        output[key] = input[key];
      }
    } else if (isConstructor(value, String)) {
      if (!isConstructor(input[key], Object)) {
        continue;
      }
      if (!input[key].hasOwnProperty(value)) {
        continue;
      }
      if (!isConstructor(output[key], Object)) {
        output[key] = {};
      }
      output[key][value] = input[key][value];
    } else if (isArray(value)) {
      if (!isConstructor(input[key], Object)) {
        continue;
      }
      if (isConstructor(output[key], Object)) {
        pluckWithArray(value, input[key], output[key]);
      } else {
        value = pluckWithArray(value, input[key], {});
        if (hasKeys(value)) {
          output[key] = value;
        }
      }
    } else if (isConstructor(value, Object)) {
      if (!isConstructor(input[key], Object)) {
        continue;
      }
      if (isConstructor(output[key], Object)) {
        pluckWithObject(value, input[key], output[key]);
      } else {
        value = pluckWithObject(value, input[key], {});
        if (hasKeys(value)) {
          output[key] = value;
        }
      }
    } else {
      throw TypeError("Invalid path argument");
    }
  }
  return output;
};

update = function(output, input) {
  var changes, key, value;
  changes = 0;
  for (key in input) {
    value = input[key];
    if (isConstructor(value, Object)) {
      if (!isConstructor(output[key], Object)) {
        changes += 1;
        output[key] = utils.cloneObject(value);
        continue;
      }
      changes += update(output[key], value);
    } else if (isArray(value)) {
      if (isArray(output[key])) {
        if (arrayEquals(value, output[key])) {
          continue;
        }
      }
      changes += 1;
      output[key] = utils.cloneArray(value);
    } else if (value !== output[key]) {
      changes += 1;
      output[key] = value;
    }
  }
  return changes;
};

resolve = function(value, ctx) {
  if (isArray(value)) {
    return resolveArray(value, ctx);
  }
  if (isConstructor(value, Object)) {
    return resolveObject(value, ctx);
  }
  if (utils.isQuery(value)) {
    ctx = Object.assign({}, ctx);
    return value._run(ctx);
  }
  return value;
};

resolveArray = function(values, ctx) {
  return values.map(function(value) {
    return resolve(value, ctx);
  });
};

resolveObject = function(values, ctx) {
  var clone, key, value;
  clone = {};
  for (key in values) {
    value = values[key];
    clone[key] = resolve(value, ctx);
  }
  return clone;
};