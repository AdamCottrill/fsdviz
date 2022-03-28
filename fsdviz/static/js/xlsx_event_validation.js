(function () {
  'use strict';

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */

  var runtime_1 = createCommonjsModule(function (module) {
  var runtime = (function (exports) {

    var Op = Object.prototype;
    var hasOwn = Op.hasOwnProperty;
    var undefined$1; // More compressible than void 0.
    var $Symbol = typeof Symbol === "function" ? Symbol : {};
    var iteratorSymbol = $Symbol.iterator || "@@iterator";
    var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
    var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

    function define(obj, key, value) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
      return obj[key];
    }
    try {
      // IE 8 has a broken Object.defineProperty that only works on DOM objects.
      define({}, "");
    } catch (err) {
      define = function(obj, key, value) {
        return obj[key] = value;
      };
    }

    function wrap(innerFn, outerFn, self, tryLocsList) {
      // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
      var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
      var generator = Object.create(protoGenerator.prototype);
      var context = new Context(tryLocsList || []);

      // The ._invoke method unifies the implementations of the .next,
      // .throw, and .return methods.
      generator._invoke = makeInvokeMethod(innerFn, self, context);

      return generator;
    }
    exports.wrap = wrap;

    // Try/catch helper to minimize deoptimizations. Returns a completion
    // record like context.tryEntries[i].completion. This interface could
    // have been (and was previously) designed to take a closure to be
    // invoked without arguments, but in all the cases we care about we
    // already have an existing method we want to call, so there's no need
    // to create a new function object. We can even get away with assuming
    // the method takes exactly one argument, since that happens to be true
    // in every case, so we don't have to touch the arguments object. The
    // only additional allocation required is the completion record, which
    // has a stable shape and so hopefully should be cheap to allocate.
    function tryCatch(fn, obj, arg) {
      try {
        return { type: "normal", arg: fn.call(obj, arg) };
      } catch (err) {
        return { type: "throw", arg: err };
      }
    }

    var GenStateSuspendedStart = "suspendedStart";
    var GenStateSuspendedYield = "suspendedYield";
    var GenStateExecuting = "executing";
    var GenStateCompleted = "completed";

    // Returning this object from the innerFn has the same effect as
    // breaking out of the dispatch switch statement.
    var ContinueSentinel = {};

    // Dummy constructor functions that we use as the .constructor and
    // .constructor.prototype properties for functions that return Generator
    // objects. For full spec compliance, you may wish to configure your
    // minifier not to mangle the names of these two functions.
    function Generator() {}
    function GeneratorFunction() {}
    function GeneratorFunctionPrototype() {}

    // This is a polyfill for %IteratorPrototype% for environments that
    // don't natively support it.
    var IteratorPrototype = {};
    IteratorPrototype[iteratorSymbol] = function () {
      return this;
    };

    var getProto = Object.getPrototypeOf;
    var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
    if (NativeIteratorPrototype &&
        NativeIteratorPrototype !== Op &&
        hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
      // This environment has a native %IteratorPrototype%; use it instead
      // of the polyfill.
      IteratorPrototype = NativeIteratorPrototype;
    }

    var Gp = GeneratorFunctionPrototype.prototype =
      Generator.prototype = Object.create(IteratorPrototype);
    GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
    GeneratorFunctionPrototype.constructor = GeneratorFunction;
    GeneratorFunction.displayName = define(
      GeneratorFunctionPrototype,
      toStringTagSymbol,
      "GeneratorFunction"
    );

    // Helper for defining the .next, .throw, and .return methods of the
    // Iterator interface in terms of a single ._invoke method.
    function defineIteratorMethods(prototype) {
      ["next", "throw", "return"].forEach(function(method) {
        define(prototype, method, function(arg) {
          return this._invoke(method, arg);
        });
      });
    }

    exports.isGeneratorFunction = function(genFun) {
      var ctor = typeof genFun === "function" && genFun.constructor;
      return ctor
        ? ctor === GeneratorFunction ||
          // For the native GeneratorFunction constructor, the best we can
          // do is to check its .name property.
          (ctor.displayName || ctor.name) === "GeneratorFunction"
        : false;
    };

    exports.mark = function(genFun) {
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
      } else {
        genFun.__proto__ = GeneratorFunctionPrototype;
        define(genFun, toStringTagSymbol, "GeneratorFunction");
      }
      genFun.prototype = Object.create(Gp);
      return genFun;
    };

    // Within the body of any async function, `await x` is transformed to
    // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
    // `hasOwn.call(value, "__await")` to determine if the yielded value is
    // meant to be awaited.
    exports.awrap = function(arg) {
      return { __await: arg };
    };

    function AsyncIterator(generator, PromiseImpl) {
      function invoke(method, arg, resolve, reject) {
        var record = tryCatch(generator[method], generator, arg);
        if (record.type === "throw") {
          reject(record.arg);
        } else {
          var result = record.arg;
          var value = result.value;
          if (value &&
              typeof value === "object" &&
              hasOwn.call(value, "__await")) {
            return PromiseImpl.resolve(value.__await).then(function(value) {
              invoke("next", value, resolve, reject);
            }, function(err) {
              invoke("throw", err, resolve, reject);
            });
          }

          return PromiseImpl.resolve(value).then(function(unwrapped) {
            // When a yielded Promise is resolved, its final value becomes
            // the .value of the Promise<{value,done}> result for the
            // current iteration.
            result.value = unwrapped;
            resolve(result);
          }, function(error) {
            // If a rejected Promise was yielded, throw the rejection back
            // into the async generator function so it can be handled there.
            return invoke("throw", error, resolve, reject);
          });
        }
      }

      var previousPromise;

      function enqueue(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function(resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }

        return previousPromise =
          // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(
            callInvokeWithMethodAndArg,
            // Avoid propagating failures to Promises returned by later
            // invocations of the iterator.
            callInvokeWithMethodAndArg
          ) : callInvokeWithMethodAndArg();
      }

      // Define the unified helper method that is used to implement .next,
      // .throw, and .return (see defineIteratorMethods).
      this._invoke = enqueue;
    }

    defineIteratorMethods(AsyncIterator.prototype);
    AsyncIterator.prototype[asyncIteratorSymbol] = function () {
      return this;
    };
    exports.AsyncIterator = AsyncIterator;

    // Note that simple async functions are implemented on top of
    // AsyncIterator objects; they just return a Promise for the value of
    // the final result produced by the iterator.
    exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
      if (PromiseImpl === void 0) PromiseImpl = Promise;

      var iter = new AsyncIterator(
        wrap(innerFn, outerFn, self, tryLocsList),
        PromiseImpl
      );

      return exports.isGeneratorFunction(outerFn)
        ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function(result) {
            return result.done ? result.value : iter.next();
          });
    };

    function makeInvokeMethod(innerFn, self, context) {
      var state = GenStateSuspendedStart;

      return function invoke(method, arg) {
        if (state === GenStateExecuting) {
          throw new Error("Generator is already running");
        }

        if (state === GenStateCompleted) {
          if (method === "throw") {
            throw arg;
          }

          // Be forgiving, per 25.3.3.3.3 of the spec:
          // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
          return doneResult();
        }

        context.method = method;
        context.arg = arg;

        while (true) {
          var delegate = context.delegate;
          if (delegate) {
            var delegateResult = maybeInvokeDelegate(delegate, context);
            if (delegateResult) {
              if (delegateResult === ContinueSentinel) continue;
              return delegateResult;
            }
          }

          if (context.method === "next") {
            // Setting context._sent for legacy support of Babel's
            // function.sent implementation.
            context.sent = context._sent = context.arg;

          } else if (context.method === "throw") {
            if (state === GenStateSuspendedStart) {
              state = GenStateCompleted;
              throw context.arg;
            }

            context.dispatchException(context.arg);

          } else if (context.method === "return") {
            context.abrupt("return", context.arg);
          }

          state = GenStateExecuting;

          var record = tryCatch(innerFn, self, context);
          if (record.type === "normal") {
            // If an exception is thrown from innerFn, we leave state ===
            // GenStateExecuting and loop back for another invocation.
            state = context.done
              ? GenStateCompleted
              : GenStateSuspendedYield;

            if (record.arg === ContinueSentinel) {
              continue;
            }

            return {
              value: record.arg,
              done: context.done
            };

          } else if (record.type === "throw") {
            state = GenStateCompleted;
            // Dispatch the exception by looping back around to the
            // context.dispatchException(context.arg) call above.
            context.method = "throw";
            context.arg = record.arg;
          }
        }
      };
    }

    // Call delegate.iterator[context.method](context.arg) and handle the
    // result, either by returning a { value, done } result from the
    // delegate iterator, or by modifying context.method and context.arg,
    // setting context.delegate to null, and returning the ContinueSentinel.
    function maybeInvokeDelegate(delegate, context) {
      var method = delegate.iterator[context.method];
      if (method === undefined$1) {
        // A .throw or .return when the delegate iterator has no .throw
        // method always terminates the yield* loop.
        context.delegate = null;

        if (context.method === "throw") {
          // Note: ["return"] must be used for ES3 parsing compatibility.
          if (delegate.iterator["return"]) {
            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            context.method = "return";
            context.arg = undefined$1;
            maybeInvokeDelegate(delegate, context);

            if (context.method === "throw") {
              // If maybeInvokeDelegate(context) changed context.method from
              // "return" to "throw", let that override the TypeError below.
              return ContinueSentinel;
            }
          }

          context.method = "throw";
          context.arg = new TypeError(
            "The iterator does not provide a 'throw' method");
        }

        return ContinueSentinel;
      }

      var record = tryCatch(method, delegate.iterator, context.arg);

      if (record.type === "throw") {
        context.method = "throw";
        context.arg = record.arg;
        context.delegate = null;
        return ContinueSentinel;
      }

      var info = record.arg;

      if (! info) {
        context.method = "throw";
        context.arg = new TypeError("iterator result is not an object");
        context.delegate = null;
        return ContinueSentinel;
      }

      if (info.done) {
        // Assign the result of the finished delegate to the temporary
        // variable specified by delegate.resultName (see delegateYield).
        context[delegate.resultName] = info.value;

        // Resume execution at the desired location (see delegateYield).
        context.next = delegate.nextLoc;

        // If context.method was "throw" but the delegate handled the
        // exception, let the outer generator proceed normally. If
        // context.method was "next", forget context.arg since it has been
        // "consumed" by the delegate iterator. If context.method was
        // "return", allow the original .return call to continue in the
        // outer generator.
        if (context.method !== "return") {
          context.method = "next";
          context.arg = undefined$1;
        }

      } else {
        // Re-yield the result returned by the delegate method.
        return info;
      }

      // The delegate iterator is finished, so forget it and continue with
      // the outer generator.
      context.delegate = null;
      return ContinueSentinel;
    }

    // Define Generator.prototype.{next,throw,return} in terms of the
    // unified ._invoke helper method.
    defineIteratorMethods(Gp);

    define(Gp, toStringTagSymbol, "Generator");

    // A Generator should always return itself as the iterator object when the
    // @@iterator function is called on it. Some browsers' implementations of the
    // iterator prototype chain incorrectly implement this, causing the Generator
    // object to not be returned from this call. This ensures that doesn't happen.
    // See https://github.com/facebook/regenerator/issues/274 for more details.
    Gp[iteratorSymbol] = function() {
      return this;
    };

    Gp.toString = function() {
      return "[object Generator]";
    };

    function pushTryEntry(locs) {
      var entry = { tryLoc: locs[0] };

      if (1 in locs) {
        entry.catchLoc = locs[1];
      }

      if (2 in locs) {
        entry.finallyLoc = locs[2];
        entry.afterLoc = locs[3];
      }

      this.tryEntries.push(entry);
    }

    function resetTryEntry(entry) {
      var record = entry.completion || {};
      record.type = "normal";
      delete record.arg;
      entry.completion = record;
    }

    function Context(tryLocsList) {
      // The root entry object (effectively a try statement without a catch
      // or a finally block) gives us a place to store values thrown from
      // locations where there is no enclosing try statement.
      this.tryEntries = [{ tryLoc: "root" }];
      tryLocsList.forEach(pushTryEntry, this);
      this.reset(true);
    }

    exports.keys = function(object) {
      var keys = [];
      for (var key in object) {
        keys.push(key);
      }
      keys.reverse();

      // Rather than returning an object with a next method, we keep
      // things simple and return the next function itself.
      return function next() {
        while (keys.length) {
          var key = keys.pop();
          if (key in object) {
            next.value = key;
            next.done = false;
            return next;
          }
        }

        // To avoid creating an additional object, we just hang the .value
        // and .done properties off the next function object itself. This
        // also ensures that the minifier will not anonymize the function.
        next.done = true;
        return next;
      };
    };

    function values(iterable) {
      if (iterable) {
        var iteratorMethod = iterable[iteratorSymbol];
        if (iteratorMethod) {
          return iteratorMethod.call(iterable);
        }

        if (typeof iterable.next === "function") {
          return iterable;
        }

        if (!isNaN(iterable.length)) {
          var i = -1, next = function next() {
            while (++i < iterable.length) {
              if (hasOwn.call(iterable, i)) {
                next.value = iterable[i];
                next.done = false;
                return next;
              }
            }

            next.value = undefined$1;
            next.done = true;

            return next;
          };

          return next.next = next;
        }
      }

      // Return an iterator with no values.
      return { next: doneResult };
    }
    exports.values = values;

    function doneResult() {
      return { value: undefined$1, done: true };
    }

    Context.prototype = {
      constructor: Context,

      reset: function(skipTempReset) {
        this.prev = 0;
        this.next = 0;
        // Resetting context._sent for legacy support of Babel's
        // function.sent implementation.
        this.sent = this._sent = undefined$1;
        this.done = false;
        this.delegate = null;

        this.method = "next";
        this.arg = undefined$1;

        this.tryEntries.forEach(resetTryEntry);

        if (!skipTempReset) {
          for (var name in this) {
            // Not sure about the optimal order of these conditions:
            if (name.charAt(0) === "t" &&
                hasOwn.call(this, name) &&
                !isNaN(+name.slice(1))) {
              this[name] = undefined$1;
            }
          }
        }
      },

      stop: function() {
        this.done = true;

        var rootEntry = this.tryEntries[0];
        var rootRecord = rootEntry.completion;
        if (rootRecord.type === "throw") {
          throw rootRecord.arg;
        }

        return this.rval;
      },

      dispatchException: function(exception) {
        if (this.done) {
          throw exception;
        }

        var context = this;
        function handle(loc, caught) {
          record.type = "throw";
          record.arg = exception;
          context.next = loc;

          if (caught) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            context.method = "next";
            context.arg = undefined$1;
          }

          return !! caught;
        }

        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          var record = entry.completion;

          if (entry.tryLoc === "root") {
            // Exception thrown outside of any try block that could handle
            // it, so set the completion value of the entire function to
            // throw the exception.
            return handle("end");
          }

          if (entry.tryLoc <= this.prev) {
            var hasCatch = hasOwn.call(entry, "catchLoc");
            var hasFinally = hasOwn.call(entry, "finallyLoc");

            if (hasCatch && hasFinally) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              } else if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else if (hasCatch) {
              if (this.prev < entry.catchLoc) {
                return handle(entry.catchLoc, true);
              }

            } else if (hasFinally) {
              if (this.prev < entry.finallyLoc) {
                return handle(entry.finallyLoc);
              }

            } else {
              throw new Error("try statement without catch or finally");
            }
          }
        }
      },

      abrupt: function(type, arg) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc <= this.prev &&
              hasOwn.call(entry, "finallyLoc") &&
              this.prev < entry.finallyLoc) {
            var finallyEntry = entry;
            break;
          }
        }

        if (finallyEntry &&
            (type === "break" ||
             type === "continue") &&
            finallyEntry.tryLoc <= arg &&
            arg <= finallyEntry.finallyLoc) {
          // Ignore the finally entry if control is not jumping to a
          // location outside the try/catch block.
          finallyEntry = null;
        }

        var record = finallyEntry ? finallyEntry.completion : {};
        record.type = type;
        record.arg = arg;

        if (finallyEntry) {
          this.method = "next";
          this.next = finallyEntry.finallyLoc;
          return ContinueSentinel;
        }

        return this.complete(record);
      },

      complete: function(record, afterLoc) {
        if (record.type === "throw") {
          throw record.arg;
        }

        if (record.type === "break" ||
            record.type === "continue") {
          this.next = record.arg;
        } else if (record.type === "return") {
          this.rval = this.arg = record.arg;
          this.method = "return";
          this.next = "end";
        } else if (record.type === "normal" && afterLoc) {
          this.next = afterLoc;
        }

        return ContinueSentinel;
      },

      finish: function(finallyLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.finallyLoc === finallyLoc) {
            this.complete(entry.completion, entry.afterLoc);
            resetTryEntry(entry);
            return ContinueSentinel;
          }
        }
      },

      "catch": function(tryLoc) {
        for (var i = this.tryEntries.length - 1; i >= 0; --i) {
          var entry = this.tryEntries[i];
          if (entry.tryLoc === tryLoc) {
            var record = entry.completion;
            if (record.type === "throw") {
              var thrown = record.arg;
              resetTryEntry(entry);
            }
            return thrown;
          }
        }

        // The context.catch method must only be called with a location
        // argument that corresponds to a known catch block.
        throw new Error("illegal catch attempt");
      },

      delegateYield: function(iterable, resultName, nextLoc) {
        this.delegate = {
          iterator: values(iterable),
          resultName: resultName,
          nextLoc: nextLoc
        };

        if (this.method === "next") {
          // Deliberately forget the last sent value so that we don't
          // accidentally pass it on to the delegate.
          this.arg = undefined$1;
        }

        return ContinueSentinel;
      }
    };

    // Regardless of whether this script is executing as a CommonJS module
    // or not, return the runtime object so that we can declare the variable
    // regeneratorRuntime in the outer scope, which allows this module to be
    // injected easily by `bin/regenerator --include-runtime script.js`.
    return exports;

  }(
    // If this script is executing as a CommonJS module, use module.exports
    // as the regeneratorRuntime namespace. Otherwise create a new empty
    // object. Either way, the resulting object will be used to initialize
    // the regeneratorRuntime variable at the top of this file.
    module.exports 
  ));

  try {
    regeneratorRuntime = runtime;
  } catch (accidentalStrictMode) {
    // This module should not be running in strict mode, so the above
    // assignment should always work unless something is misconfigured. Just
    // in case runtime.js accidentally runs in strict mode, we can escape
    // strict mode using a global Function call. This could conceivably fail
    // if a Content Security Policy forbids using Function, but in that case
    // the proper solution is to fix the accidental strict mode problem. If
    // you've misconfigured your bundler to force strict mode and applied a
    // CSP to forbid Function, and you're not willing to fix either of those
    // problems, please detail your unique predicament in a GitHub issue.
    Function("r", "regeneratorRuntime = r")(runtime);
  }
  });

  var regenerator = runtime_1;

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending(f(d), x);
    };
  }

  bisector(ascending);

  var noop = {value: function() {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get$1(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set$1(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  dispatch("start", "end", "cancel", "interrupt");

  var prefix = "$";

  function Map$2() {}

  Map$2.prototype = map$1.prototype = {
    constructor: Map$2,
    has: function(key) {
      return (prefix + key) in this;
    },
    get: function(key) {
      return this[prefix + key];
    },
    set: function(key, value) {
      this[prefix + key] = value;
      return this;
    },
    remove: function(key) {
      var property = prefix + key;
      return property in this && delete this[property];
    },
    clear: function() {
      for (var property in this) if (property[0] === prefix) delete this[property];
    },
    keys: function() {
      var keys = [];
      for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
      return keys;
    },
    values: function() {
      var values = [];
      for (var property in this) if (property[0] === prefix) values.push(this[property]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
      return entries;
    },
    size: function() {
      var size = 0;
      for (var property in this) if (property[0] === prefix) ++size;
      return size;
    },
    empty: function() {
      for (var property in this) if (property[0] === prefix) return false;
      return true;
    },
    each: function(f) {
      for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  };

  function map$1(object, f) {
    var map = new Map$2;

    // Copy constructor.
    if (object instanceof Map$2) object.each(function(value, key) { map.set(key, value); });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) map.set(i, object[i]);
      else while (++i < n) map.set(f(o = object[i], i, object), o);
    }

    // Convert object to map.
    else if (object) for (var key in object) map.set(key, object[key]);

    return map;
  }

  function Set$2() {}

  var proto = map$1.prototype;

  Set$2.prototype = {
    constructor: Set$2,
    has: proto.has,
    add: function(value) {
      value += "";
      this[prefix + value] = value;
      return this;
    },
    remove: proto.remove,
    clear: proto.clear,
    values: proto.keys,
    size: proto.size,
    empty: proto.empty,
    each: proto.each
  };

  function responseJson(response) {
    if (!response.ok) throw new Error(response.status + " " + response.statusText);
    if (response.status === 204 || response.status === 205) return;
    return response.json();
  }

  function json(input, init) {
    return fetch(input, init).then(responseJson);
  }

  dispatch("start", "end", "cancel", "interrupt");

  dispatch("start", "end", "cancel", "interrupt");

  // ES6 Map
  var map;
  try {
    map = Map;
  } catch (_) { }
  var set;

  // ES6 Set
  try {
    set = Set;
  } catch (_) { }

  function baseClone (src, circulars, clones) {
    // Null/undefined/functions/etc
    if (!src || typeof src !== 'object' || typeof src === 'function') {
      return src
    }

    // DOM Node
    if (src.nodeType && 'cloneNode' in src) {
      return src.cloneNode(true)
    }

    // Date
    if (src instanceof Date) {
      return new Date(src.getTime())
    }

    // RegExp
    if (src instanceof RegExp) {
      return new RegExp(src)
    }

    // Arrays
    if (Array.isArray(src)) {
      return src.map(clone)
    }

    // ES6 Maps
    if (map && src instanceof map) {
      return new Map(Array.from(src.entries()))
    }

    // ES6 Sets
    if (set && src instanceof set) {
      return new Set(Array.from(src.values()))
    }

    // Object
    if (src instanceof Object) {
      circulars.push(src);
      var obj = Object.create(src);
      clones.push(obj);
      for (var key in src) {
        var idx = circulars.findIndex(function (i) {
          return i === src[key]
        });
        obj[key] = idx > -1 ? clones[idx] : baseClone(src[key], circulars, clones);
      }
      return obj
    }

    // ???
    return src
  }

  function clone (src) {
    return baseClone(src, [], [])
  }

  const toString$1 = Object.prototype.toString;
  const errorToString = Error.prototype.toString;
  const regExpToString = RegExp.prototype.toString;
  const symbolToString$1 = typeof Symbol !== 'undefined' ? Symbol.prototype.toString : () => '';
  const SYMBOL_REGEXP = /^Symbol\((.*)\)(.*)$/;

  function printNumber(val) {
    if (val != +val) return 'NaN';
    const isNegativeZero = val === 0 && 1 / val < 0;
    return isNegativeZero ? '-0' : '' + val;
  }

  function printSimpleValue(val, quoteStrings = false) {
    if (val == null || val === true || val === false) return '' + val;
    const typeOf = typeof val;
    if (typeOf === 'number') return printNumber(val);
    if (typeOf === 'string') return quoteStrings ? `"${val}"` : val;
    if (typeOf === 'function') return '[Function ' + (val.name || 'anonymous') + ']';
    if (typeOf === 'symbol') return symbolToString$1.call(val).replace(SYMBOL_REGEXP, 'Symbol($1)');
    const tag = toString$1.call(val).slice(8, -1);
    if (tag === 'Date') return isNaN(val.getTime()) ? '' + val : val.toISOString(val);
    if (tag === 'Error' || val instanceof Error) return '[' + errorToString.call(val) + ']';
    if (tag === 'RegExp') return regExpToString.call(val);
    return null;
  }

  function printValue(value, quoteStrings) {
    let result = printSimpleValue(value, quoteStrings);
    if (result !== null) return result;
    return JSON.stringify(value, function (key, value) {
      let result = printSimpleValue(this[key], quoteStrings);
      if (result !== null) return result;
      return value;
    }, 2);
  }

  let mixed = {
    default: '${path} is invalid',
    required: '${path} is a required field',
    oneOf: '${path} must be one of the following values: ${values}',
    notOneOf: '${path} must not be one of the following values: ${values}',
    notType: ({
      path,
      type,
      value,
      originalValue
    }) => {
      let isCast = originalValue != null && originalValue !== value;
      let msg = `${path} must be a \`${type}\` type, ` + `but the final value was: \`${printValue(value, true)}\`` + (isCast ? ` (cast from the value \`${printValue(originalValue, true)}\`).` : '.');

      if (value === null) {
        msg += `\n If "null" is intended as an empty value be sure to mark the schema as \`.nullable()\``;
      }

      return msg;
    },
    defined: '${path} must be defined'
  };
  let string = {
    length: '${path} must be exactly ${length} characters',
    min: '${path} must be at least ${min} characters',
    max: '${path} must be at most ${max} characters',
    matches: '${path} must match the following: "${regex}"',
    email: '${path} must be a valid email',
    url: '${path} must be a valid URL',
    uuid: '${path} must be a valid UUID',
    trim: '${path} must be a trimmed string',
    lowercase: '${path} must be a lowercase string',
    uppercase: '${path} must be a upper case string'
  };
  let number = {
    min: '${path} must be greater than or equal to ${min}',
    max: '${path} must be less than or equal to ${max}',
    lessThan: '${path} must be less than ${less}',
    moreThan: '${path} must be greater than ${more}',
    positive: '${path} must be a positive number',
    negative: '${path} must be a negative number',
    integer: '${path} must be an integer'
  };
  let date = {
    min: '${path} field must be later than ${min}',
    max: '${path} field must be at earlier than ${max}'
  };
  let boolean = {
    isValue: '${path} field must be ${value}'
  };
  let object = {
    noUnknown: '${path} field has unspecified keys: ${unknown}'
  };
  let array$1 = {
    min: '${path} field must have at least ${min} items',
    max: '${path} field must have less than or equal to ${max} items',
    length: '${path} must be have ${length} items'
  };
  Object.assign(Object.create(null), {
    mixed,
    string,
    number,
    date,
    object,
    array: array$1,
    boolean
  });

  /** Used for built-in method references. */
  var objectProto$c = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$9 = objectProto$c.hasOwnProperty;

  /**
   * The base implementation of `_.has` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHas(object, key) {
    return object != null && hasOwnProperty$9.call(object, key);
  }

  var _baseHas = baseHas;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  var isArray_1 = isArray;

  /** Detect free variable `global` from Node.js. */

  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  var _freeGlobal = freeGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = _freeGlobal || freeSelf || Function('return this')();

  var _root = root;

  /** Built-in value references. */
  var Symbol$1 = _root.Symbol;

  var _Symbol = Symbol$1;

  /** Used for built-in method references. */
  var objectProto$b = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$b.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$b.toString;

  /** Built-in value references. */
  var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty$8.call(value, symToStringTag$1),
        tag = value[symToStringTag$1];

    try {
      value[symToStringTag$1] = undefined;
      var unmasked = true;
    } catch (e) {}

    var result = nativeObjectToString$1.call(value);
    if (unmasked) {
      if (isOwn) {
        value[symToStringTag$1] = tag;
      } else {
        delete value[symToStringTag$1];
      }
    }
    return result;
  }

  var _getRawTag = getRawTag;

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto$a.toString;

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString.call(value);
  }

  var _objectToString = objectToString;

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';

  /** Built-in value references. */
  var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag && symToStringTag in Object(value))
      ? _getRawTag(value)
      : _objectToString(value);
  }

  var _baseGetTag = baseGetTag;

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  var isObjectLike_1 = isObjectLike;

  /** `Object#toString` result references. */
  var symbolTag$1 = '[object Symbol]';

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$1);
  }

  var isSymbol_1 = isSymbol;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/;

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray_1(value)) {
      return false;
    }
    var type = typeof value;
    if (type == 'number' || type == 'symbol' || type == 'boolean' ||
        value == null || isSymbol_1(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
      (object != null && value in Object(object));
  }

  var _isKey = isKey;

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject$1(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  var isObject_1 = isObject$1;

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag$1 = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject_1(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = _baseGetTag(value);
    return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  var isFunction_1 = isFunction;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = _root['__core-js_shared__'];

  var _coreJsData = coreJsData;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  var _isMasked = isMasked;

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString$1.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  var _toSource = toSource;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto = Function.prototype,
      objectProto$9 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$9.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString.call(hasOwnProperty$7).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject_1(value) || _isMasked(value)) {
      return false;
    }
    var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
    return pattern.test(_toSource(value));
  }

  var _baseIsNative = baseIsNative;

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  var _getValue = getValue;

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = _getValue(object, key);
    return _baseIsNative(value) ? value : undefined;
  }

  var _getNative = getNative;

  /* Built-in method references that are verified to be native. */
  var nativeCreate = _getNative(Object, 'create');

  var _nativeCreate = nativeCreate;

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
    this.size = 0;
  }

  var _hashClear = hashClear;

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  var _hashDelete = hashDelete;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (_nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED$2 ? undefined : result;
    }
    return hasOwnProperty$6.call(data, key) ? data[key] : undefined;
  }

  var _hashGet = hashGet;

  /** Used for built-in method references. */
  var objectProto$7 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$5.call(data, key);
  }

  var _hashHas = hashHas;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
    return this;
  }

  var _hashSet = hashSet;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = _hashClear;
  Hash.prototype['delete'] = _hashDelete;
  Hash.prototype.get = _hashGet;
  Hash.prototype.has = _hashHas;
  Hash.prototype.set = _hashSet;

  var _Hash = Hash;

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  var _listCacheClear = listCacheClear;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  var eq_1 = eq;

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq_1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  var _assocIndexOf = assocIndexOf;

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var splice = arrayProto.splice;

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  var _listCacheDelete = listCacheDelete;

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  var _listCacheGet = listCacheGet;

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return _assocIndexOf(this.__data__, key) > -1;
  }

  var _listCacheHas = listCacheHas;

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  var _listCacheSet = listCacheSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = _listCacheClear;
  ListCache.prototype['delete'] = _listCacheDelete;
  ListCache.prototype.get = _listCacheGet;
  ListCache.prototype.has = _listCacheHas;
  ListCache.prototype.set = _listCacheSet;

  var _ListCache = ListCache;

  /* Built-in method references that are verified to be native. */
  var Map$1 = _getNative(_root, 'Map');

  var _Map = Map$1;

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new _Hash,
      'map': new (_Map || _ListCache),
      'string': new _Hash
    };
  }

  var _mapCacheClear = mapCacheClear;

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }

  var _isKeyable = isKeyable;

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return _isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }

  var _getMapData = getMapData;

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = _getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  var _mapCacheDelete = mapCacheDelete;

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return _getMapData(this, key).get(key);
  }

  var _mapCacheGet = mapCacheGet;

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return _getMapData(this, key).has(key);
  }

  var _mapCacheHas = mapCacheHas;

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = _getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  var _mapCacheSet = mapCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = _mapCacheClear;
  MapCache.prototype['delete'] = _mapCacheDelete;
  MapCache.prototype.get = _mapCacheGet;
  MapCache.prototype.has = _mapCacheHas;
  MapCache.prototype.set = _mapCacheSet;

  var _MapCache = MapCache;

  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `clear`, `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize.Cache || _MapCache);
    return memoized;
  }

  // Expose `MapCache`.
  memoize.Cache = _MapCache;

  var memoize_1 = memoize;

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize_1(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });

    var cache = result.cache;
    return result;
  }

  var _memoizeCapped = memoizeCapped;

  /** Used to match property names within property paths. */
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = _memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46 /* . */) {
      result.push('');
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
    });
    return result;
  });

  var _stringToPath = stringToPath;

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  var _arrayMap = arrayMap;

  /** Used as references for various `Number` constants. */
  var INFINITY$1 = 1 / 0;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
      symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray_1(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return _arrayMap(value, baseToString) + '';
    }
    if (isSymbol_1(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
  }

  var _baseToString = baseToString;

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : _baseToString(value);
  }

  var toString_1 = toString;

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {Object} [object] The object to query keys on.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value, object) {
    if (isArray_1(value)) {
      return value;
    }
    return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
  }

  var _castPath = castPath;

  /** `Object#toString` result references. */
  var argsTag$2 = '[object Arguments]';

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike_1(value) && _baseGetTag(value) == argsTag$2;
  }

  var _baseIsArguments = baseIsArguments;

  /** Used for built-in method references. */
  var objectProto$6 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable$1 = objectProto$6.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
    return isObjectLike_1(value) && hasOwnProperty$4.call(value, 'callee') &&
      !propertyIsEnumerable$1.call(value, 'callee');
  };

  var isArguments_1 = isArguments;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$1 = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER$1 : length;

    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }

  var _isIndex = isIndex;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  var isLength_1 = isLength;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol_1(value)) {
      return value;
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }

  var _toKey = toKey;

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = _castPath(path, object);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
      var key = _toKey(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result || ++index != length) {
      return result;
    }
    length = object == null ? 0 : object.length;
    return !!length && isLength_1(length) && _isIndex(key, length) &&
      (isArray_1(object) || isArguments_1(object));
  }

  var _hasPath = hasPath;

  /**
   * Checks if `path` is a direct property of `object`.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = { 'a': { 'b': 2 } };
   * var other = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.has(object, 'a');
   * // => true
   *
   * _.has(object, 'a.b');
   * // => true
   *
   * _.has(object, ['a', 'b']);
   * // => true
   *
   * _.has(other, 'a');
   * // => false
   */
  function has(object, path) {
    return object != null && _hasPath(object, path, _baseHas);
  }

  var has_1 = has;

  var isSchema = (obj => obj && obj.__isYupSchema__);

  class Condition {
    constructor(refs, options) {
      this.refs = refs;
      this.refs = refs;

      if (typeof options === 'function') {
        this.fn = options;
        return;
      }

      if (!has_1(options, 'is')) throw new TypeError('`is:` is required for `when()` conditions');
      if (!options.then && !options.otherwise) throw new TypeError('either `then:` or `otherwise:` is required for `when()` conditions');
      let {
        is,
        then,
        otherwise
      } = options;
      let check = typeof is === 'function' ? is : (...values) => values.every(value => value === is);

      this.fn = function (...args) {
        let options = args.pop();
        let schema = args.pop();
        let branch = check(...args) ? then : otherwise;
        if (!branch) return undefined;
        if (typeof branch === 'function') return branch(schema);
        return schema.concat(branch.resolve(options));
      };
    }

    resolve(base, options) {
      let values = this.refs.map(ref => ref.getValue(options == null ? void 0 : options.value, options == null ? void 0 : options.parent, options == null ? void 0 : options.context));
      let schema = this.fn.apply(base, values.concat(base, options));
      if (schema === undefined || schema === base) return base;
      if (!isSchema(schema)) throw new TypeError('conditions must return a schema object');
      return schema.resolve(options);
    }

  }

  function toArray(value) {
    return value == null ? [] : [].concat(value);
  }

  function _extends$3() { _extends$3 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$3.apply(this, arguments); }
  let strReg = /\$\{\s*(\w+)\s*\}/g;
  class ValidationError extends Error {
    static formatError(message, params) {
      const path = params.label || params.path || 'this';
      if (path !== params.path) params = _extends$3({}, params, {
        path
      });
      if (typeof message === 'string') return message.replace(strReg, (_, key) => printValue(params[key]));
      if (typeof message === 'function') return message(params);
      return message;
    }

    static isError(err) {
      return err && err.name === 'ValidationError';
    }

    constructor(errorOrErrors, value, field, type) {
      super();
      this.name = 'ValidationError';
      this.value = value;
      this.path = field;
      this.type = type;
      this.errors = [];
      this.inner = [];
      toArray(errorOrErrors).forEach(err => {
        if (ValidationError.isError(err)) {
          this.errors.push(...err.errors);
          this.inner = this.inner.concat(err.inner.length ? err.inner : err);
        } else {
          this.errors.push(err);
        }
      });
      this.message = this.errors.length > 1 ? `${this.errors.length} errors occurred` : this.errors[0];
      if (Error.captureStackTrace) Error.captureStackTrace(this, ValidationError);
    }

  }

  const once = cb => {
    let fired = false;
    return (...args) => {
      if (fired) return;
      fired = true;
      cb(...args);
    };
  };

  function runTests(options, cb) {
    let {
      endEarly,
      tests,
      args,
      value,
      errors,
      sort,
      path
    } = options;
    let callback = once(cb);
    let count = tests.length;
    const nestedErrors = [];
    errors = errors ? errors : [];
    if (!count) return errors.length ? callback(new ValidationError(errors, value, path)) : callback(null, value);

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      test(args, function finishTestRun(err) {
        if (err) {
          // always return early for non validation errors
          if (!ValidationError.isError(err)) {
            return callback(err, value);
          }

          if (endEarly) {
            err.value = value;
            return callback(err, value);
          }

          nestedErrors.push(err);
        }

        if (--count <= 0) {
          if (nestedErrors.length) {
            if (sort) nestedErrors.sort(sort); //show parent errors after the nested ones: name.first, name

            if (errors.length) nestedErrors.push(...errors);
            errors = nestedErrors;
          }

          if (errors.length) {
            callback(new ValidationError(errors, value, path), value);
            return;
          }

          callback(null, value);
        }
      });
    }
  }

  var defineProperty = (function() {
    try {
      var func = _getNative(Object, 'defineProperty');
      func({}, '', {});
      return func;
    } catch (e) {}
  }());

  var _defineProperty = defineProperty;

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && _defineProperty) {
      _defineProperty(object, key, {
        'configurable': true,
        'enumerable': true,
        'value': value,
        'writable': true
      });
    } else {
      object[key] = value;
    }
  }

  var _baseAssignValue = baseAssignValue;

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  var _createBaseFor = createBaseFor;

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = _createBaseFor();

  var _baseFor = baseFor;

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  var _baseTimes = baseTimes;

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  var stubFalse_1 = stubFalse;

  var isBuffer_1 = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse_1;

  module.exports = isBuffer;
  });

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]',
      arrayTag$1 = '[object Array]',
      boolTag$1 = '[object Boolean]',
      dateTag$1 = '[object Date]',
      errorTag$1 = '[object Error]',
      funcTag = '[object Function]',
      mapTag$2 = '[object Map]',
      numberTag$1 = '[object Number]',
      objectTag$2 = '[object Object]',
      regexpTag$1 = '[object RegExp]',
      setTag$2 = '[object Set]',
      stringTag$1 = '[object String]',
      weakMapTag$1 = '[object WeakMap]';

  var arrayBufferTag$1 = '[object ArrayBuffer]',
      dataViewTag$2 = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag$1] =
  typedArrayTags[arrayBufferTag$1] = typedArrayTags[boolTag$1] =
  typedArrayTags[dataViewTag$2] = typedArrayTags[dateTag$1] =
  typedArrayTags[errorTag$1] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag$2] = typedArrayTags[numberTag$1] =
  typedArrayTags[objectTag$2] = typedArrayTags[regexpTag$1] =
  typedArrayTags[setTag$2] = typedArrayTags[stringTag$1] =
  typedArrayTags[weakMapTag$1] = false;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike_1(value) &&
      isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
  }

  var _baseIsTypedArray = baseIsTypedArray;

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  var _baseUnary = baseUnary;

  var _nodeUtil = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && _freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  module.exports = nodeUtil;
  });

  /* Node.js helper references. */
  var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

  var isTypedArray_1 = isTypedArray;

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$5.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray_1(value),
        isArg = !isArr && isArguments_1(value),
        isBuff = !isArr && !isArg && isBuffer_1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? _baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty$3.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             _isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  var _arrayLikeKeys = arrayLikeKeys;

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$4;

    return value === proto;
  }

  var _isPrototype = isPrototype;

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  var _overArg = overArg;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = _overArg(Object.keys, Object);

  var _nativeKeys = nativeKeys;

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!_isPrototype(object)) {
      return _nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$2.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeys = baseKeys;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength_1(value.length) && !isFunction_1(value);
  }

  var isArrayLike_1 = isArrayLike;

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
  }

  var keys_1 = keys;

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && _baseFor(object, iteratee, keys_1);
  }

  var _baseForOwn = baseForOwn;

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new _ListCache;
    this.size = 0;
  }

  var _stackClear = stackClear;

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  var _stackDelete = stackDelete;

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  var _stackGet = stackGet;

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  var _stackHas = stackHas;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof _ListCache) {
      var pairs = data.__data__;
      if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new _MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  var _stackSet = stackSet;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new _ListCache(entries);
    this.size = data.size;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = _stackClear;
  Stack.prototype['delete'] = _stackDelete;
  Stack.prototype.get = _stackGet;
  Stack.prototype.has = _stackHas;
  Stack.prototype.set = _stackSet;

  var _Stack = Stack;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }

  var _setCacheAdd = setCacheAdd;

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  var _setCacheHas = setCacheHas;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
        length = values == null ? 0 : values.length;

    this.__data__ = new _MapCache;
    while (++index < length) {
      this.add(values[index]);
    }
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
  SetCache.prototype.has = _setCacheHas;

  var _SetCache = SetCache;

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  var _arraySome = arraySome;

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  var _cacheHas = cacheHas;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$5 = 1,
      COMPARE_UNORDERED_FLAG$3 = 2;

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$5,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Check that cyclic values are equal.
    var arrStacked = stack.get(array);
    var othStacked = stack.get(other);
    if (arrStacked && othStacked) {
      return arrStacked == other && othStacked == array;
    }
    var index = -1,
        result = true,
        seen = (bitmask & COMPARE_UNORDERED_FLAG$3) ? new _SetCache : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, arrValue, index, other, array, stack)
          : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!_arraySome(other, function(othValue, othIndex) {
              if (!_cacheHas(seen, othIndex) &&
                  (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
          result = false;
          break;
        }
      } else if (!(
            arrValue === othValue ||
              equalFunc(arrValue, othValue, bitmask, customizer, stack)
          )) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  var _equalArrays = equalArrays;

  /** Built-in value references. */
  var Uint8Array = _root.Uint8Array;

  var _Uint8Array = Uint8Array;

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  var _mapToArray = mapToArray;

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }

  var _setToArray = setToArray;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$4 = 1,
      COMPARE_UNORDERED_FLAG$2 = 2;

  /** `Object#toString` result references. */
  var boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      mapTag$1 = '[object Map]',
      numberTag = '[object Number]',
      regexpTag = '[object RegExp]',
      setTag$1 = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag$1 = '[object DataView]';

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag$1:
        if ((object.byteLength != other.byteLength) ||
            (object.byteOffset != other.byteOffset)) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag:
        if ((object.byteLength != other.byteLength) ||
            !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq_1(+object, +other);

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == (other + '');

      case mapTag$1:
        var convert = _mapToArray;

      case setTag$1:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG$4;
        convert || (convert = _setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG$2;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack['delete'](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  var _equalByTag = equalByTag;

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  var _arrayPush = arrayPush;

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
  }

  var _baseGetAllKeys = baseGetAllKeys;

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  var _arrayFilter = arrayFilter;

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  var stubArray_1 = stubArray;

  /** Used for built-in method references. */
  var objectProto$2 = Object.prototype;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto$2.propertyIsEnumerable;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return _arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable.call(object, symbol);
    });
  };

  var _getSymbols = getSymbols;

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return _baseGetAllKeys(object, keys_1, _getSymbols);
  }

  var _getAllKeys = getAllKeys;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$3 = 1;

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3,
        objProps = _getAllKeys(object),
        objLength = objProps.length,
        othProps = _getAllKeys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
        return false;
      }
    }
    // Check that cyclic values are equal.
    var objStacked = stack.get(object);
    var othStacked = stack.get(other);
    if (objStacked && othStacked) {
      return objStacked == other && othStacked == object;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, objValue, key, other, object, stack)
          : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined
            ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
            : compared
          )) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor &&
          ('constructor' in object && 'constructor' in other) &&
          !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
            typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  var _equalObjects = equalObjects;

  /* Built-in method references that are verified to be native. */
  var DataView = _getNative(_root, 'DataView');

  var _DataView = DataView;

  /* Built-in method references that are verified to be native. */
  var Promise$1 = _getNative(_root, 'Promise');

  var _Promise = Promise$1;

  /* Built-in method references that are verified to be native. */
  var Set$1 = _getNative(_root, 'Set');

  var _Set = Set$1;

  /* Built-in method references that are verified to be native. */
  var WeakMap = _getNative(_root, 'WeakMap');

  var _WeakMap = WeakMap;

  /** `Object#toString` result references. */
  var mapTag = '[object Map]',
      objectTag$1 = '[object Object]',
      promiseTag = '[object Promise]',
      setTag = '[object Set]',
      weakMapTag = '[object WeakMap]';

  var dataViewTag = '[object DataView]';

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = _toSource(_DataView),
      mapCtorString = _toSource(_Map),
      promiseCtorString = _toSource(_Promise),
      setCtorString = _toSource(_Set),
      weakMapCtorString = _toSource(_WeakMap);

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = _baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag) ||
      (_Map && getTag(new _Map) != mapTag) ||
      (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
      (_Set && getTag(new _Set) != setTag) ||
      (_WeakMap && getTag(new _WeakMap) != weakMapTag)) {
    getTag = function(value) {
      var result = _baseGetTag(value),
          Ctor = result == objectTag$1 ? value.constructor : undefined,
          ctorString = Ctor ? _toSource(Ctor) : '';

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString: return dataViewTag;
          case mapCtorString: return mapTag;
          case promiseCtorString: return promiseTag;
          case setCtorString: return setTag;
          case weakMapCtorString: return weakMapTag;
        }
      }
      return result;
    };
  }

  var _getTag = getTag;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$2 = 1;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      objectTag = '[object Object]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray_1(object),
        othIsArr = isArray_1(other),
        objTag = objIsArr ? arrayTag : _getTag(object),
        othTag = othIsArr ? arrayTag : _getTag(other);

    objTag = objTag == argsTag ? objectTag : objTag;
    othTag = othTag == argsTag ? objectTag : othTag;

    var objIsObj = objTag == objectTag,
        othIsObj = othTag == objectTag,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer_1(object)) {
      if (!isBuffer_1(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new _Stack);
      return (objIsArr || isTypedArray_1(object))
        ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack)
        : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$2)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new _Stack);
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new _Stack);
    return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }

  var _baseIsEqualDeep = baseIsEqualDeep;

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Unordered comparison
   *  2 - Partial comparison
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || (!isObjectLike_1(value) && !isObjectLike_1(other))) {
      return value !== value && other !== other;
    }
    return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }

  var _baseIsEqual = baseIsEqual;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$1 = 1,
      COMPARE_UNORDERED_FLAG$1 = 2;

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if ((noCustomizer && data[2])
            ? data[1] !== object[data[0]]
            : !(data[0] in object)
          ) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0],
          objValue = object[key],
          srcValue = data[1];

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false;
        }
      } else {
        var stack = new _Stack;
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === undefined
              ? _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$1 | COMPARE_UNORDERED_FLAG$1, customizer, stack)
              : result
            )) {
          return false;
        }
      }
    }
    return true;
  }

  var _baseIsMatch = baseIsMatch;

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject_1(value);
  }

  var _isStrictComparable = isStrictComparable;

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
    var result = keys_1(object),
        length = result.length;

    while (length--) {
      var key = result[length],
          value = object[key];

      result[length] = [key, value, _isStrictComparable(value)];
    }
    return result;
  }

  var _getMatchData = getMatchData;

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue &&
        (srcValue !== undefined || (key in Object(object)));
    };
  }

  var _matchesStrictComparable = matchesStrictComparable;

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = _getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return _matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function(object) {
      return object === source || _baseIsMatch(object, source, matchData);
    };
  }

  var _baseMatches = baseMatches;

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = _castPath(path, object);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[_toKey(path[index++])];
    }
    return (index && index == length) ? object : undefined;
  }

  var _baseGet = baseGet;

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get(object, path, defaultValue) {
    var result = object == null ? undefined : _baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }

  var get_1 = get;

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object);
  }

  var _baseHasIn = baseHasIn;

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && _hasPath(object, path, _baseHasIn);
  }

  var hasIn_1 = hasIn;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (_isKey(path) && _isStrictComparable(srcValue)) {
      return _matchesStrictComparable(_toKey(path), srcValue);
    }
    return function(object) {
      var objValue = get_1(object, path);
      return (objValue === undefined && objValue === srcValue)
        ? hasIn_1(object, path)
        : _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
    };
  }

  var _baseMatchesProperty = baseMatchesProperty;

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  var identity_1 = identity;

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key];
    };
  }

  var _baseProperty = baseProperty;

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function(object) {
      return _baseGet(object, path);
    };
  }

  var _basePropertyDeep = basePropertyDeep;

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return _isKey(path) ? _baseProperty(_toKey(path)) : _basePropertyDeep(path);
  }

  var property_1 = property;

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value;
    }
    if (value == null) {
      return identity_1;
    }
    if (typeof value == 'object') {
      return isArray_1(value)
        ? _baseMatchesProperty(value[0], value[1])
        : _baseMatches(value);
    }
    return property_1(value);
  }

  var _baseIteratee = baseIteratee;

  /**
   * Creates an object with the same keys as `object` and values generated
   * by running each own enumerable string keyed property of `object` thru
   * `iteratee`. The iteratee is invoked with three arguments:
   * (value, key, object).
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Object
   * @param {Object} object The object to iterate over.
   * @param {Function} [iteratee=_.identity] The function invoked per iteration.
   * @returns {Object} Returns the new mapped object.
   * @see _.mapKeys
   * @example
   *
   * var users = {
   *   'fred':    { 'user': 'fred',    'age': 40 },
   *   'pebbles': { 'user': 'pebbles', 'age': 1 }
   * };
   *
   * _.mapValues(users, function(o) { return o.age; });
   * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
   *
   * // The `_.property` iteratee shorthand.
   * _.mapValues(users, 'age');
   * // => { 'fred': 40, 'pebbles': 1 } (iteration order is not guaranteed)
   */
  function mapValues(object, iteratee) {
    var result = {};
    iteratee = _baseIteratee(iteratee);

    _baseForOwn(object, function(value, key, object) {
      _baseAssignValue(result, key, iteratee(value, key, object));
    });
    return result;
  }

  var mapValues_1 = mapValues;

  /**
   * Based on Kendo UI Core expression code <https://github.com/telerik/kendo-ui-core#license-information>
   */

  function Cache(maxSize) {
    this._maxSize = maxSize;
    this.clear();
  }
  Cache.prototype.clear = function () {
    this._size = 0;
    this._values = Object.create(null);
  };
  Cache.prototype.get = function (key) {
    return this._values[key]
  };
  Cache.prototype.set = function (key, value) {
    this._size >= this._maxSize && this.clear();
    if (!(key in this._values)) this._size++;

    return (this._values[key] = value)
  };

  var SPLIT_REGEX = /[^.^\]^[]+|(?=\[\]|\.\.)/g,
    DIGIT_REGEX = /^\d+$/,
    LEAD_DIGIT_REGEX = /^\d/,
    SPEC_CHAR_REGEX = /[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g,
    CLEAN_QUOTES_REGEX = /^\s*(['"]?)(.*?)(\1)\s*$/,
    MAX_CACHE_SIZE = 512;

  var pathCache = new Cache(MAX_CACHE_SIZE),
    setCache = new Cache(MAX_CACHE_SIZE),
    getCache = new Cache(MAX_CACHE_SIZE);

  var propertyExpr = {
    Cache: Cache,

    split: split,

    normalizePath: normalizePath,

    setter: function (path) {
      var parts = normalizePath(path);

      return (
        setCache.get(path) ||
        setCache.set(path, function setter(obj, value) {
          var index = 0;
          var len = parts.length;
          var data = obj;

          while (index < len - 1) {
            var part = parts[index];
            if (
              part === '__proto__' ||
              part === 'constructor' ||
              part === 'prototype'
            ) {
              return obj
            }

            data = data[parts[index++]];
          }
          data[parts[index]] = value;
        })
      )
    },

    getter: function (path, safe) {
      var parts = normalizePath(path);
      return (
        getCache.get(path) ||
        getCache.set(path, function getter(data) {
          var index = 0,
            len = parts.length;
          while (index < len) {
            if (data != null || !safe) data = data[parts[index++]];
            else return
          }
          return data
        })
      )
    },

    join: function (segments) {
      return segments.reduce(function (path, part) {
        return (
          path +
          (isQuoted(part) || DIGIT_REGEX.test(part)
            ? '[' + part + ']'
            : (path ? '.' : '') + part)
        )
      }, '')
    },

    forEach: function (path, cb, thisArg) {
      forEach(Array.isArray(path) ? path : split(path), cb, thisArg);
    },
  };

  function normalizePath(path) {
    return (
      pathCache.get(path) ||
      pathCache.set(
        path,
        split(path).map(function (part) {
          return part.replace(CLEAN_QUOTES_REGEX, '$2')
        })
      )
    )
  }

  function split(path) {
    return path.match(SPLIT_REGEX)
  }

  function forEach(parts, iter, thisArg) {
    var len = parts.length,
      part,
      idx,
      isArray,
      isBracket;

    for (idx = 0; idx < len; idx++) {
      part = parts[idx];

      if (part) {
        if (shouldBeQuoted(part)) {
          part = '"' + part + '"';
        }

        isBracket = isQuoted(part);
        isArray = !isBracket && /^\d+$/.test(part);

        iter.call(thisArg, part, isBracket, isArray, idx, parts);
      }
    }
  }

  function isQuoted(str) {
    return (
      typeof str === 'string' && str && ["'", '"'].indexOf(str.charAt(0)) !== -1
    )
  }

  function hasLeadingNumber(part) {
    return part.match(LEAD_DIGIT_REGEX) && !part.match(DIGIT_REGEX)
  }

  function hasSpecialChars(part) {
    return SPEC_CHAR_REGEX.test(part)
  }

  function shouldBeQuoted(part) {
    return !isQuoted(part) && (hasLeadingNumber(part) || hasSpecialChars(part))
  }

  const prefixes = {
    context: '$',
    value: '.'
  };
  class Reference {
    constructor(key, options = {}) {
      if (typeof key !== 'string') throw new TypeError('ref must be a string, got: ' + key);
      this.key = key.trim();
      if (key === '') throw new TypeError('ref must be a non-empty string');
      this.isContext = this.key[0] === prefixes.context;
      this.isValue = this.key[0] === prefixes.value;
      this.isSibling = !this.isContext && !this.isValue;
      let prefix = this.isContext ? prefixes.context : this.isValue ? prefixes.value : '';
      this.path = this.key.slice(prefix.length);
      this.getter = this.path && propertyExpr.getter(this.path, true);
      this.map = options.map;
    }

    getValue(value, parent, context) {
      let result = this.isContext ? context : this.isValue ? value : parent;
      if (this.getter) result = this.getter(result || {});
      if (this.map) result = this.map(result);
      return result;
    }
    /**
     *
     * @param {*} value
     * @param {Object} options
     * @param {Object=} options.context
     * @param {Object=} options.parent
     */


    cast(value, options) {
      return this.getValue(value, options == null ? void 0 : options.parent, options == null ? void 0 : options.context);
    }

    resolve() {
      return this;
    }

    describe() {
      return {
        type: 'ref',
        key: this.key
      };
    }

    toString() {
      return `Ref(${this.key})`;
    }

    static isRef(value) {
      return value && value.__isYupRef;
    }

  } // @ts-ignore

  Reference.prototype.__isYupRef = true;

  function _extends$2() { _extends$2 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$2.apply(this, arguments); }

  function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
  function createValidation(config) {
    function validate(_ref, cb) {
      let {
        value,
        path = '',
        label,
        options,
        originalValue,
        sync
      } = _ref,
          rest = _objectWithoutPropertiesLoose(_ref, ["value", "path", "label", "options", "originalValue", "sync"]);

      const {
        name,
        test,
        params,
        message
      } = config;
      let {
        parent,
        context
      } = options;

      function resolve(item) {
        return Reference.isRef(item) ? item.getValue(value, parent, context) : item;
      }

      function createError(overrides = {}) {
        const nextParams = mapValues_1(_extends$2({
          value,
          originalValue,
          label,
          path: overrides.path || path
        }, params, overrides.params), resolve);
        const error = new ValidationError(ValidationError.formatError(overrides.message || message, nextParams), value, nextParams.path, overrides.type || name);
        error.params = nextParams;
        return error;
      }

      let ctx = _extends$2({
        path,
        parent,
        type: name,
        createError,
        resolve,
        options,
        originalValue
      }, rest);

      if (!sync) {
        try {
          Promise.resolve(test.call(ctx, value, ctx)).then(validOrError => {
            if (ValidationError.isError(validOrError)) cb(validOrError);else if (!validOrError) cb(createError());else cb(null, validOrError);
          });
        } catch (err) {
          cb(err);
        }

        return;
      }

      let result;

      try {
        var _ref2;

        result = test.call(ctx, value, ctx);

        if (typeof ((_ref2 = result) == null ? void 0 : _ref2.then) === 'function') {
          throw new Error(`Validation test of type: "${ctx.type}" returned a Promise during a synchronous validate. ` + `This test will finish after the validate call has returned`);
        }
      } catch (err) {
        cb(err);
        return;
      }

      if (ValidationError.isError(result)) cb(result);else if (!result) cb(createError());else cb(null, result);
    }

    validate.OPTIONS = config;
    return validate;
  }

  let trim = part => part.substr(0, part.length - 1).substr(1);

  function getIn(schema, path, value, context = value) {
    let parent, lastPart, lastPartDebug; // root path: ''

    if (!path) return {
      parent,
      parentPath: path,
      schema
    };
    propertyExpr.forEach(path, (_part, isBracket, isArray) => {
      let part = isBracket ? trim(_part) : _part;
      schema = schema.resolve({
        context,
        parent,
        value
      });

      if (schema.innerType) {
        let idx = isArray ? parseInt(part, 10) : 0;

        if (value && idx >= value.length) {
          throw new Error(`Yup.reach cannot resolve an array item at index: ${_part}, in the path: ${path}. ` + `because there is no value at that index. `);
        }

        parent = value;
        value = value && value[idx];
        schema = schema.innerType;
      } // sometimes the array index part of a path doesn't exist: "nested.arr.child"
      // in these cases the current part is the next schema and should be processed
      // in this iteration. For cases where the index signature is included this
      // check will fail and we'll handle the `child` part on the next iteration like normal


      if (!isArray) {
        if (!schema.fields || !schema.fields[part]) throw new Error(`The schema does not contain the path: ${path}. ` + `(failed at: ${lastPartDebug} which is a type: "${schema._type}")`);
        parent = value;
        value = value && value[part];
        schema = schema.fields[part];
      }

      lastPart = part;
      lastPartDebug = isBracket ? '[' + _part + ']' : '.' + _part;
    });
    return {
      schema,
      parent,
      parentPath: lastPart
    };
  }

  class ReferenceSet {
    constructor() {
      this.list = new Set();
      this.refs = new Map();
    }

    get size() {
      return this.list.size + this.refs.size;
    }

    describe() {
      const description = [];

      for (const item of this.list) description.push(item);

      for (const [, ref] of this.refs) description.push(ref.describe());

      return description;
    }

    toArray() {
      return Array.from(this.list).concat(Array.from(this.refs.values()));
    }

    add(value) {
      Reference.isRef(value) ? this.refs.set(value.key, value) : this.list.add(value);
    }

    delete(value) {
      Reference.isRef(value) ? this.refs.delete(value.key) : this.list.delete(value);
    }

    has(value, resolve) {
      if (this.list.has(value)) return true;
      let item,
          values = this.refs.values();

      while (item = values.next(), !item.done) if (resolve(item.value) === value) return true;

      return false;
    }

    clone() {
      const next = new ReferenceSet();
      next.list = new Set(this.list);
      next.refs = new Map(this.refs);
      return next;
    }

    merge(newItems, removeItems) {
      const next = this.clone();
      newItems.list.forEach(value => next.add(value));
      newItems.refs.forEach(value => next.add(value));
      removeItems.list.forEach(value => next.delete(value));
      removeItems.refs.forEach(value => next.delete(value));
      return next;
    }

  }

  function _extends$1() { _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$1.apply(this, arguments); }
  class BaseSchema {
    constructor(options) {
      this.deps = [];
      this.conditions = [];
      this._whitelist = new ReferenceSet();
      this._blacklist = new ReferenceSet();
      this.exclusiveTests = Object.create(null);
      this.tests = [];
      this.transforms = [];
      this.withMutation(() => {
        this.typeError(mixed.notType);
      });
      this.type = (options == null ? void 0 : options.type) || 'mixed';
      this.spec = _extends$1({
        strip: false,
        strict: false,
        abortEarly: true,
        recursive: true,
        nullable: false,
        presence: 'optional'
      }, options == null ? void 0 : options.spec);
    } // TODO: remove


    get _type() {
      return this.type;
    }

    _typeCheck(_value) {
      return true;
    }

    clone(spec) {
      if (this._mutate) {
        if (spec) Object.assign(this.spec, spec);
        return this;
      } // if the nested value is a schema we can skip cloning, since
      // they are already immutable


      const next = Object.create(Object.getPrototypeOf(this)); // @ts-expect-error this is readonly

      next.type = this.type;
      next._typeError = this._typeError;
      next._whitelistError = this._whitelistError;
      next._blacklistError = this._blacklistError;
      next._whitelist = this._whitelist.clone();
      next._blacklist = this._blacklist.clone();
      next.exclusiveTests = _extends$1({}, this.exclusiveTests); // @ts-expect-error this is readonly

      next.deps = [...this.deps];
      next.conditions = [...this.conditions];
      next.tests = [...this.tests];
      next.transforms = [...this.transforms];
      next.spec = clone(_extends$1({}, this.spec, spec));
      return next;
    }

    label(label) {
      var next = this.clone();
      next.spec.label = label;
      return next;
    }

    meta(...args) {
      if (args.length === 0) return this.spec.meta;
      let next = this.clone();
      next.spec.meta = Object.assign(next.spec.meta || {}, args[0]);
      return next;
    } // withContext<TContext extends AnyObject>(): BaseSchema<
    //   TCast,
    //   TContext,
    //   TOutput
    // > {
    //   return this as any;
    // }


    withMutation(fn) {
      let before = this._mutate;
      this._mutate = true;
      let result = fn(this);
      this._mutate = before;
      return result;
    }

    concat(schema) {
      if (!schema || schema === this) return this;
      if (schema.type !== this.type && this.type !== 'mixed') throw new TypeError(`You cannot \`concat()\` schema's of different types: ${this.type} and ${schema.type}`);
      let base = this;
      let combined = schema.clone();

      const mergedSpec = _extends$1({}, base.spec, combined.spec); // if (combined.spec.nullable === UNSET)
      //   mergedSpec.nullable = base.spec.nullable;
      // if (combined.spec.presence === UNSET)
      //   mergedSpec.presence = base.spec.presence;


      combined.spec = mergedSpec;
      combined._typeError || (combined._typeError = base._typeError);
      combined._whitelistError || (combined._whitelistError = base._whitelistError);
      combined._blacklistError || (combined._blacklistError = base._blacklistError); // manually merge the blacklist/whitelist (the other `schema` takes
      // precedence in case of conflicts)

      combined._whitelist = base._whitelist.merge(schema._whitelist, schema._blacklist);
      combined._blacklist = base._blacklist.merge(schema._blacklist, schema._whitelist); // start with the current tests

      combined.tests = base.tests;
      combined.exclusiveTests = base.exclusiveTests; // manually add the new tests to ensure
      // the deduping logic is consistent

      combined.withMutation(next => {
        schema.tests.forEach(fn => {
          next.test(fn.OPTIONS);
        });
      });
      return combined;
    }

    isType(v) {
      if (this.spec.nullable && v === null) return true;
      return this._typeCheck(v);
    }

    resolve(options) {
      let schema = this;

      if (schema.conditions.length) {
        let conditions = schema.conditions;
        schema = schema.clone();
        schema.conditions = [];
        schema = conditions.reduce((schema, condition) => condition.resolve(schema, options), schema);
        schema = schema.resolve(options);
      }

      return schema;
    }
    /**
     *
     * @param {*} value
     * @param {Object} options
     * @param {*=} options.parent
     * @param {*=} options.context
     */


    cast(value, options = {}) {
      let resolvedSchema = this.resolve(_extends$1({
        value
      }, options));

      let result = resolvedSchema._cast(value, options);

      if (value !== undefined && options.assert !== false && resolvedSchema.isType(result) !== true) {
        let formattedValue = printValue(value);
        let formattedResult = printValue(result);
        throw new TypeError(`The value of ${options.path || 'field'} could not be cast to a value ` + `that satisfies the schema type: "${resolvedSchema._type}". \n\n` + `attempted value: ${formattedValue} \n` + (formattedResult !== formattedValue ? `result of cast: ${formattedResult}` : ''));
      }

      return result;
    }

    _cast(rawValue, _options) {
      let value = rawValue === undefined ? rawValue : this.transforms.reduce((value, fn) => fn.call(this, value, rawValue, this), rawValue);

      if (value === undefined) {
        value = this.getDefault();
      }

      return value;
    }

    _validate(_value, options = {}, cb) {
      let {
        sync,
        path,
        from = [],
        originalValue = _value,
        strict = this.spec.strict,
        abortEarly = this.spec.abortEarly
      } = options;
      let value = _value;

      if (!strict) {
        // this._validating = true;
        value = this._cast(value, _extends$1({
          assert: false
        }, options)); // this._validating = false;
      } // value is cast, we can check if it meets type requirements


      let args = {
        value,
        path,
        options,
        originalValue,
        schema: this,
        label: this.spec.label,
        sync,
        from
      };
      let initialTests = [];
      if (this._typeError) initialTests.push(this._typeError);
      if (this._whitelistError) initialTests.push(this._whitelistError);
      if (this._blacklistError) initialTests.push(this._blacklistError);
      runTests({
        args,
        value,
        path,
        sync,
        tests: initialTests,
        endEarly: abortEarly
      }, err => {
        if (err) return void cb(err, value);
        runTests({
          tests: this.tests,
          args,
          path,
          sync,
          value,
          endEarly: abortEarly
        }, cb);
      });
    }

    validate(value, options, maybeCb) {
      let schema = this.resolve(_extends$1({}, options, {
        value
      })); // callback case is for nested validations

      return typeof maybeCb === 'function' ? schema._validate(value, options, maybeCb) : new Promise((resolve, reject) => schema._validate(value, options, (err, value) => {
        if (err) reject(err);else resolve(value);
      }));
    }

    validateSync(value, options) {
      let schema = this.resolve(_extends$1({}, options, {
        value
      }));
      let result;

      schema._validate(value, _extends$1({}, options, {
        sync: true
      }), (err, value) => {
        if (err) throw err;
        result = value;
      });

      return result;
    }

    isValid(value, options) {
      return this.validate(value, options).then(() => true, err => {
        if (ValidationError.isError(err)) return false;
        throw err;
      });
    }

    isValidSync(value, options) {
      try {
        this.validateSync(value, options);
        return true;
      } catch (err) {
        if (ValidationError.isError(err)) return false;
        throw err;
      }
    }

    _getDefault() {
      let defaultValue = this.spec.default;

      if (defaultValue == null) {
        return defaultValue;
      }

      return typeof defaultValue === 'function' ? defaultValue.call(this) : clone(defaultValue);
    }

    getDefault(options) {
      let schema = this.resolve(options || {});
      return schema._getDefault();
    }

    default(def) {
      if (arguments.length === 0) {
        return this._getDefault();
      }

      let next = this.clone({
        default: def
      });
      return next;
    }

    strict(isStrict = true) {
      var next = this.clone();
      next.spec.strict = isStrict;
      return next;
    }

    _isPresent(value) {
      return value != null;
    }

    defined(message = mixed.defined) {
      return this.test({
        message,
        name: 'defined',
        exclusive: true,

        test(value) {
          return value !== undefined;
        }

      });
    }

    required(message = mixed.required) {
      return this.clone({
        presence: 'required'
      }).withMutation(s => s.test({
        message,
        name: 'required',
        exclusive: true,

        test(value) {
          return this.schema._isPresent(value);
        }

      }));
    }

    notRequired() {
      var next = this.clone({
        presence: 'optional'
      });
      next.tests = next.tests.filter(test => test.OPTIONS.name !== 'required');
      return next;
    }

    nullable(isNullable = true) {
      var next = this.clone({
        nullable: isNullable !== false
      });
      return next;
    }

    transform(fn) {
      var next = this.clone();
      next.transforms.push(fn);
      return next;
    }
    /**
     * Adds a test function to the schema's queue of tests.
     * tests can be exclusive or non-exclusive.
     *
     * - exclusive tests, will replace any existing tests of the same name.
     * - non-exclusive: can be stacked
     *
     * If a non-exclusive test is added to a schema with an exclusive test of the same name
     * the exclusive test is removed and further tests of the same name will be stacked.
     *
     * If an exclusive test is added to a schema with non-exclusive tests of the same name
     * the previous tests are removed and further tests of the same name will replace each other.
     */


    test(...args) {
      let opts;

      if (args.length === 1) {
        if (typeof args[0] === 'function') {
          opts = {
            test: args[0]
          };
        } else {
          opts = args[0];
        }
      } else if (args.length === 2) {
        opts = {
          name: args[0],
          test: args[1]
        };
      } else {
        opts = {
          name: args[0],
          message: args[1],
          test: args[2]
        };
      }

      if (opts.message === undefined) opts.message = mixed.default;
      if (typeof opts.test !== 'function') throw new TypeError('`test` is a required parameters');
      let next = this.clone();
      let validate = createValidation(opts);
      let isExclusive = opts.exclusive || opts.name && next.exclusiveTests[opts.name] === true;

      if (opts.exclusive) {
        if (!opts.name) throw new TypeError('Exclusive tests must provide a unique `name` identifying the test');
      }

      if (opts.name) next.exclusiveTests[opts.name] = !!opts.exclusive;
      next.tests = next.tests.filter(fn => {
        if (fn.OPTIONS.name === opts.name) {
          if (isExclusive) return false;
          if (fn.OPTIONS.test === validate.OPTIONS.test) return false;
        }

        return true;
      });
      next.tests.push(validate);
      return next;
    }

    when(keys, options) {
      if (!Array.isArray(keys) && typeof keys !== 'string') {
        options = keys;
        keys = '.';
      }

      let next = this.clone();
      let deps = toArray(keys).map(key => new Reference(key));
      deps.forEach(dep => {
        // @ts-ignore
        if (dep.isSibling) next.deps.push(dep.key);
      });
      next.conditions.push(new Condition(deps, options));
      return next;
    }

    typeError(message) {
      var next = this.clone();
      next._typeError = createValidation({
        message,
        name: 'typeError',

        test(value) {
          if (value !== undefined && !this.schema.isType(value)) return this.createError({
            params: {
              type: this.schema._type
            }
          });
          return true;
        }

      });
      return next;
    }

    oneOf(enums, message = mixed.oneOf) {
      var next = this.clone();
      enums.forEach(val => {
        next._whitelist.add(val);

        next._blacklist.delete(val);
      });
      next._whitelistError = createValidation({
        message,
        name: 'oneOf',

        test(value) {
          if (value === undefined) return true;
          let valids = this.schema._whitelist;
          return valids.has(value, this.resolve) ? true : this.createError({
            params: {
              values: valids.toArray().join(', ')
            }
          });
        }

      });
      return next;
    }

    notOneOf(enums, message = mixed.notOneOf) {
      var next = this.clone();
      enums.forEach(val => {
        next._blacklist.add(val);

        next._whitelist.delete(val);
      });
      next._blacklistError = createValidation({
        message,
        name: 'notOneOf',

        test(value) {
          let invalids = this.schema._blacklist;
          if (invalids.has(value, this.resolve)) return this.createError({
            params: {
              values: invalids.toArray().join(', ')
            }
          });
          return true;
        }

      });
      return next;
    }

    strip(strip = true) {
      let next = this.clone();
      next.spec.strip = strip;
      return next;
    }

    describe() {
      const next = this.clone();
      const {
        label,
        meta
      } = next.spec;
      const description = {
        meta,
        label,
        type: next.type,
        oneOf: next._whitelist.describe(),
        notOneOf: next._blacklist.describe(),
        tests: next.tests.map(fn => ({
          name: fn.OPTIONS.name,
          params: fn.OPTIONS.params
        })).filter((n, idx, list) => list.findIndex(c => c.name === n.name) === idx)
      };
      return description;
    }

  }
  // @ts-expect-error
  BaseSchema.prototype.__isYupSchema__ = true;

  for (const method of ['validate', 'validateSync']) BaseSchema.prototype[`${method}At`] = function (path, value, options = {}) {
    const {
      parent,
      parentPath,
      schema
    } = getIn(this, path, value, options.context);
    return schema[method](parent && parent[parentPath], _extends$1({}, options, {
      parent,
      path
    }));
  };

  for (const alias of ['equals', 'is']) BaseSchema.prototype[alias] = BaseSchema.prototype.oneOf;

  for (const alias of ['not', 'nope']) BaseSchema.prototype[alias] = BaseSchema.prototype.notOneOf;

  BaseSchema.prototype.optional = BaseSchema.prototype.notRequired;

  var isAbsent = (value => value == null);

  let rEmail = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i; // eslint-disable-next-line

  let rUrl = /^((https?|ftp):)?\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i; // eslint-disable-next-line

  let rUUID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

  let isTrimmed = value => isAbsent(value) || value === value.trim();

  let objStringTag = {}.toString();
  function create$2() {
    return new StringSchema();
  }
  class StringSchema extends BaseSchema {
    constructor() {
      super({
        type: 'string'
      });
      this.withMutation(() => {
        this.transform(function (value) {
          if (this.isType(value)) return value;
          if (Array.isArray(value)) return value;
          const strValue = value != null && value.toString ? value.toString() : value;
          if (strValue === objStringTag) return value;
          return strValue;
        });
      });
    }

    _typeCheck(value) {
      if (value instanceof String) value = value.valueOf();
      return typeof value === 'string';
    }

    _isPresent(value) {
      return super._isPresent(value) && !!value.length;
    }

    length(length, message = string.length) {
      return this.test({
        message,
        name: 'length',
        exclusive: true,
        params: {
          length
        },

        test(value) {
          return isAbsent(value) || value.length === this.resolve(length);
        }

      });
    }

    min(min, message = string.min) {
      return this.test({
        message,
        name: 'min',
        exclusive: true,
        params: {
          min
        },

        test(value) {
          return isAbsent(value) || value.length >= this.resolve(min);
        }

      });
    }

    max(max, message = string.max) {
      return this.test({
        name: 'max',
        exclusive: true,
        message,
        params: {
          max
        },

        test(value) {
          return isAbsent(value) || value.length <= this.resolve(max);
        }

      });
    }

    matches(regex, options) {
      let excludeEmptyString = false;
      let message;
      let name;

      if (options) {
        if (typeof options === 'object') {
          ({
            excludeEmptyString = false,
            message,
            name
          } = options);
        } else {
          message = options;
        }
      }

      return this.test({
        name: name || 'matches',
        message: message || string.matches,
        params: {
          regex
        },
        test: value => isAbsent(value) || value === '' && excludeEmptyString || value.search(regex) !== -1
      });
    }

    email(message = string.email) {
      return this.matches(rEmail, {
        name: 'email',
        message,
        excludeEmptyString: true
      });
    }

    url(message = string.url) {
      return this.matches(rUrl, {
        name: 'url',
        message,
        excludeEmptyString: true
      });
    }

    uuid(message = string.uuid) {
      return this.matches(rUUID, {
        name: 'uuid',
        message,
        excludeEmptyString: false
      });
    } //-- transforms --


    ensure() {
      return this.default('').transform(val => val === null ? '' : val);
    }

    trim(message = string.trim) {
      return this.transform(val => val != null ? val.trim() : val).test({
        message,
        name: 'trim',
        test: isTrimmed
      });
    }

    lowercase(message = string.lowercase) {
      return this.transform(value => !isAbsent(value) ? value.toLowerCase() : value).test({
        message,
        name: 'string_case',
        exclusive: true,
        test: value => isAbsent(value) || value === value.toLowerCase()
      });
    }

    uppercase(message = string.uppercase) {
      return this.transform(value => !isAbsent(value) ? value.toUpperCase() : value).test({
        message,
        name: 'string_case',
        exclusive: true,
        test: value => isAbsent(value) || value === value.toUpperCase()
      });
    }

  }
  create$2.prototype = StringSchema.prototype; //
  // String Interfaces
  //

  let isNaN$1 = value => value != +value;

  function create$1() {
    return new NumberSchema();
  }
  class NumberSchema extends BaseSchema {
    constructor() {
      super({
        type: 'number'
      });
      this.withMutation(() => {
        this.transform(function (value) {
          let parsed = value;

          if (typeof parsed === 'string') {
            parsed = parsed.replace(/\s/g, '');
            if (parsed === '') return NaN; // don't use parseFloat to avoid positives on alpha-numeric strings

            parsed = +parsed;
          }

          if (this.isType(parsed)) return parsed;
          return parseFloat(parsed);
        });
      });
    }

    _typeCheck(value) {
      if (value instanceof Number) value = value.valueOf();
      return typeof value === 'number' && !isNaN$1(value);
    }

    min(min, message = number.min) {
      return this.test({
        message,
        name: 'min',
        exclusive: true,
        params: {
          min
        },

        test(value) {
          return isAbsent(value) || value >= this.resolve(min);
        }

      });
    }

    max(max, message = number.max) {
      return this.test({
        message,
        name: 'max',
        exclusive: true,
        params: {
          max
        },

        test(value) {
          return isAbsent(value) || value <= this.resolve(max);
        }

      });
    }

    lessThan(less, message = number.lessThan) {
      return this.test({
        message,
        name: 'max',
        exclusive: true,
        params: {
          less
        },

        test(value) {
          return isAbsent(value) || value < this.resolve(less);
        }

      });
    }

    moreThan(more, message = number.moreThan) {
      return this.test({
        message,
        name: 'min',
        exclusive: true,
        params: {
          more
        },

        test(value) {
          return isAbsent(value) || value > this.resolve(more);
        }

      });
    }

    positive(msg = number.positive) {
      return this.moreThan(0, msg);
    }

    negative(msg = number.negative) {
      return this.lessThan(0, msg);
    }

    integer(message = number.integer) {
      return this.test({
        name: 'integer',
        message,
        test: val => isAbsent(val) || Number.isInteger(val)
      });
    }

    truncate() {
      return this.transform(value => !isAbsent(value) ? value | 0 : value);
    }

    round(method) {
      var _method;

      var avail = ['ceil', 'floor', 'round', 'trunc'];
      method = ((_method = method) == null ? void 0 : _method.toLowerCase()) || 'round'; // this exists for symemtry with the new Math.trunc

      if (method === 'trunc') return this.truncate();
      if (avail.indexOf(method.toLowerCase()) === -1) throw new TypeError('Only valid options for round() are: ' + avail.join(', '));
      return this.transform(value => !isAbsent(value) ? Math[method](value) : value);
    }

  }
  create$1.prototype = NumberSchema.prototype; //
  // Number Interfaces
  //

  /**
   * A specialized version of `_.reduce` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the first element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array == null ? 0 : array.length;

    if (initAccum && length) {
      accumulator = array[++index];
    }
    while (++index < length) {
      accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
  }

  var _arrayReduce = arrayReduce;

  /**
   * The base implementation of `_.propertyOf` without support for deep paths.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyOf(object) {
    return function(key) {
      return object == null ? undefined : object[key];
    };
  }

  var _basePropertyOf = basePropertyOf;

  /** Used to map Latin Unicode letters to basic Latin letters. */
  var deburredLetters = {
    // Latin-1 Supplement block.
    '\xc0': 'A',  '\xc1': 'A', '\xc2': 'A', '\xc3': 'A', '\xc4': 'A', '\xc5': 'A',
    '\xe0': 'a',  '\xe1': 'a', '\xe2': 'a', '\xe3': 'a', '\xe4': 'a', '\xe5': 'a',
    '\xc7': 'C',  '\xe7': 'c',
    '\xd0': 'D',  '\xf0': 'd',
    '\xc8': 'E',  '\xc9': 'E', '\xca': 'E', '\xcb': 'E',
    '\xe8': 'e',  '\xe9': 'e', '\xea': 'e', '\xeb': 'e',
    '\xcc': 'I',  '\xcd': 'I', '\xce': 'I', '\xcf': 'I',
    '\xec': 'i',  '\xed': 'i', '\xee': 'i', '\xef': 'i',
    '\xd1': 'N',  '\xf1': 'n',
    '\xd2': 'O',  '\xd3': 'O', '\xd4': 'O', '\xd5': 'O', '\xd6': 'O', '\xd8': 'O',
    '\xf2': 'o',  '\xf3': 'o', '\xf4': 'o', '\xf5': 'o', '\xf6': 'o', '\xf8': 'o',
    '\xd9': 'U',  '\xda': 'U', '\xdb': 'U', '\xdc': 'U',
    '\xf9': 'u',  '\xfa': 'u', '\xfb': 'u', '\xfc': 'u',
    '\xdd': 'Y',  '\xfd': 'y', '\xff': 'y',
    '\xc6': 'Ae', '\xe6': 'ae',
    '\xde': 'Th', '\xfe': 'th',
    '\xdf': 'ss',
    // Latin Extended-A block.
    '\u0100': 'A',  '\u0102': 'A', '\u0104': 'A',
    '\u0101': 'a',  '\u0103': 'a', '\u0105': 'a',
    '\u0106': 'C',  '\u0108': 'C', '\u010a': 'C', '\u010c': 'C',
    '\u0107': 'c',  '\u0109': 'c', '\u010b': 'c', '\u010d': 'c',
    '\u010e': 'D',  '\u0110': 'D', '\u010f': 'd', '\u0111': 'd',
    '\u0112': 'E',  '\u0114': 'E', '\u0116': 'E', '\u0118': 'E', '\u011a': 'E',
    '\u0113': 'e',  '\u0115': 'e', '\u0117': 'e', '\u0119': 'e', '\u011b': 'e',
    '\u011c': 'G',  '\u011e': 'G', '\u0120': 'G', '\u0122': 'G',
    '\u011d': 'g',  '\u011f': 'g', '\u0121': 'g', '\u0123': 'g',
    '\u0124': 'H',  '\u0126': 'H', '\u0125': 'h', '\u0127': 'h',
    '\u0128': 'I',  '\u012a': 'I', '\u012c': 'I', '\u012e': 'I', '\u0130': 'I',
    '\u0129': 'i',  '\u012b': 'i', '\u012d': 'i', '\u012f': 'i', '\u0131': 'i',
    '\u0134': 'J',  '\u0135': 'j',
    '\u0136': 'K',  '\u0137': 'k', '\u0138': 'k',
    '\u0139': 'L',  '\u013b': 'L', '\u013d': 'L', '\u013f': 'L', '\u0141': 'L',
    '\u013a': 'l',  '\u013c': 'l', '\u013e': 'l', '\u0140': 'l', '\u0142': 'l',
    '\u0143': 'N',  '\u0145': 'N', '\u0147': 'N', '\u014a': 'N',
    '\u0144': 'n',  '\u0146': 'n', '\u0148': 'n', '\u014b': 'n',
    '\u014c': 'O',  '\u014e': 'O', '\u0150': 'O',
    '\u014d': 'o',  '\u014f': 'o', '\u0151': 'o',
    '\u0154': 'R',  '\u0156': 'R', '\u0158': 'R',
    '\u0155': 'r',  '\u0157': 'r', '\u0159': 'r',
    '\u015a': 'S',  '\u015c': 'S', '\u015e': 'S', '\u0160': 'S',
    '\u015b': 's',  '\u015d': 's', '\u015f': 's', '\u0161': 's',
    '\u0162': 'T',  '\u0164': 'T', '\u0166': 'T',
    '\u0163': 't',  '\u0165': 't', '\u0167': 't',
    '\u0168': 'U',  '\u016a': 'U', '\u016c': 'U', '\u016e': 'U', '\u0170': 'U', '\u0172': 'U',
    '\u0169': 'u',  '\u016b': 'u', '\u016d': 'u', '\u016f': 'u', '\u0171': 'u', '\u0173': 'u',
    '\u0174': 'W',  '\u0175': 'w',
    '\u0176': 'Y',  '\u0177': 'y', '\u0178': 'Y',
    '\u0179': 'Z',  '\u017b': 'Z', '\u017d': 'Z',
    '\u017a': 'z',  '\u017c': 'z', '\u017e': 'z',
    '\u0132': 'IJ', '\u0133': 'ij',
    '\u0152': 'Oe', '\u0153': 'oe',
    '\u0149': "'n", '\u017f': 's'
  };

  /**
   * Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
   * letters to basic Latin letters.
   *
   * @private
   * @param {string} letter The matched letter to deburr.
   * @returns {string} Returns the deburred letter.
   */
  var deburrLetter = _basePropertyOf(deburredLetters);

  var _deburrLetter = deburrLetter;

  /** Used to match Latin Unicode letters (excluding mathematical operators). */
  var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;

  /** Used to compose unicode character classes. */
  var rsComboMarksRange$3 = '\\u0300-\\u036f',
      reComboHalfMarksRange$3 = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange$3 = '\\u20d0-\\u20ff',
      rsComboRange$3 = rsComboMarksRange$3 + reComboHalfMarksRange$3 + rsComboSymbolsRange$3;

  /** Used to compose unicode capture groups. */
  var rsCombo$2 = '[' + rsComboRange$3 + ']';

  /**
   * Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
   * [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
   */
  var reComboMark = RegExp(rsCombo$2, 'g');

  /**
   * Deburrs `string` by converting
   * [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
   * and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
   * letters to basic Latin letters and removing
   * [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to deburr.
   * @returns {string} Returns the deburred string.
   * @example
   *
   * _.deburr('déjà vu');
   * // => 'deja vu'
   */
  function deburr(string) {
    string = toString_1(string);
    return string && string.replace(reLatin, _deburrLetter).replace(reComboMark, '');
  }

  var deburr_1 = deburr;

  /** Used to match words composed of alphanumeric characters. */
  var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;

  /**
   * Splits an ASCII `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function asciiWords(string) {
    return string.match(reAsciiWord) || [];
  }

  var _asciiWords = asciiWords;

  /** Used to detect strings that need a more robust regexp to match words. */
  var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;

  /**
   * Checks if `string` contains a word composed of Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a word is found, else `false`.
   */
  function hasUnicodeWord(string) {
    return reHasUnicodeWord.test(string);
  }

  var _hasUnicodeWord = hasUnicodeWord;

  /** Used to compose unicode character classes. */
  var rsAstralRange$2 = '\\ud800-\\udfff',
      rsComboMarksRange$2 = '\\u0300-\\u036f',
      reComboHalfMarksRange$2 = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange$2 = '\\u20d0-\\u20ff',
      rsComboRange$2 = rsComboMarksRange$2 + reComboHalfMarksRange$2 + rsComboSymbolsRange$2,
      rsDingbatRange = '\\u2700-\\u27bf',
      rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff',
      rsMathOpRange = '\\xac\\xb1\\xd7\\xf7',
      rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf',
      rsPunctuationRange = '\\u2000-\\u206f',
      rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000',
      rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde',
      rsVarRange$2 = '\\ufe0e\\ufe0f',
      rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;

  /** Used to compose unicode capture groups. */
  var rsApos$1 = "['\u2019]",
      rsBreak = '[' + rsBreakRange + ']',
      rsCombo$1 = '[' + rsComboRange$2 + ']',
      rsDigits = '\\d+',
      rsDingbat = '[' + rsDingbatRange + ']',
      rsLower = '[' + rsLowerRange + ']',
      rsMisc = '[^' + rsAstralRange$2 + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + ']',
      rsFitz$1 = '\\ud83c[\\udffb-\\udfff]',
      rsModifier$1 = '(?:' + rsCombo$1 + '|' + rsFitz$1 + ')',
      rsNonAstral$1 = '[^' + rsAstralRange$2 + ']',
      rsRegional$1 = '(?:\\ud83c[\\udde6-\\uddff]){2}',
      rsSurrPair$1 = '[\\ud800-\\udbff][\\udc00-\\udfff]',
      rsUpper = '[' + rsUpperRange + ']',
      rsZWJ$2 = '\\u200d';

  /** Used to compose unicode regexes. */
  var rsMiscLower = '(?:' + rsLower + '|' + rsMisc + ')',
      rsMiscUpper = '(?:' + rsUpper + '|' + rsMisc + ')',
      rsOptContrLower = '(?:' + rsApos$1 + '(?:d|ll|m|re|s|t|ve))?',
      rsOptContrUpper = '(?:' + rsApos$1 + '(?:D|LL|M|RE|S|T|VE))?',
      reOptMod$1 = rsModifier$1 + '?',
      rsOptVar$1 = '[' + rsVarRange$2 + ']?',
      rsOptJoin$1 = '(?:' + rsZWJ$2 + '(?:' + [rsNonAstral$1, rsRegional$1, rsSurrPair$1].join('|') + ')' + rsOptVar$1 + reOptMod$1 + ')*',
      rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])',
      rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])',
      rsSeq$1 = rsOptVar$1 + reOptMod$1 + rsOptJoin$1,
      rsEmoji = '(?:' + [rsDingbat, rsRegional$1, rsSurrPair$1].join('|') + ')' + rsSeq$1;

  /** Used to match complex or compound words. */
  var reUnicodeWord = RegExp([
    rsUpper + '?' + rsLower + '+' + rsOptContrLower + '(?=' + [rsBreak, rsUpper, '$'].join('|') + ')',
    rsMiscUpper + '+' + rsOptContrUpper + '(?=' + [rsBreak, rsUpper + rsMiscLower, '$'].join('|') + ')',
    rsUpper + '?' + rsMiscLower + '+' + rsOptContrLower,
    rsUpper + '+' + rsOptContrUpper,
    rsOrdUpper,
    rsOrdLower,
    rsDigits,
    rsEmoji
  ].join('|'), 'g');

  /**
   * Splits a Unicode `string` into an array of its words.
   *
   * @private
   * @param {string} The string to inspect.
   * @returns {Array} Returns the words of `string`.
   */
  function unicodeWords(string) {
    return string.match(reUnicodeWord) || [];
  }

  var _unicodeWords = unicodeWords;

  /**
   * Splits `string` into an array of its words.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to inspect.
   * @param {RegExp|string} [pattern] The pattern to match words.
   * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
   * @returns {Array} Returns the words of `string`.
   * @example
   *
   * _.words('fred, barney, & pebbles');
   * // => ['fred', 'barney', 'pebbles']
   *
   * _.words('fred, barney, & pebbles', /[^, ]+/g);
   * // => ['fred', 'barney', '&', 'pebbles']
   */
  function words(string, pattern, guard) {
    string = toString_1(string);
    pattern = guard ? undefined : pattern;

    if (pattern === undefined) {
      return _hasUnicodeWord(string) ? _unicodeWords(string) : _asciiWords(string);
    }
    return string.match(pattern) || [];
  }

  var words_1 = words;

  /** Used to compose unicode capture groups. */
  var rsApos = "['\u2019]";

  /** Used to match apostrophes. */
  var reApos = RegExp(rsApos, 'g');

  /**
   * Creates a function like `_.camelCase`.
   *
   * @private
   * @param {Function} callback The function to combine each word.
   * @returns {Function} Returns the new compounder function.
   */
  function createCompounder(callback) {
    return function(string) {
      return _arrayReduce(words_1(deburr_1(string).replace(reApos, '')), callback, '');
    };
  }

  var _createCompounder = createCompounder;

  /**
   * Converts `string` to
   * [snake case](https://en.wikipedia.org/wiki/Snake_case).
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to convert.
   * @returns {string} Returns the snake cased string.
   * @example
   *
   * _.snakeCase('Foo Bar');
   * // => 'foo_bar'
   *
   * _.snakeCase('fooBar');
   * // => 'foo_bar'
   *
   * _.snakeCase('--FOO-BAR--');
   * // => 'foo_bar'
   */
  var snakeCase = _createCompounder(function(result, word, index) {
    return result + (index ? '_' : '') + word.toLowerCase();
  });

  var snakeCase_1 = snakeCase;

  /**
   * The base implementation of `_.slice` without an iteratee call guard.
   *
   * @private
   * @param {Array} array The array to slice.
   * @param {number} [start=0] The start position.
   * @param {number} [end=array.length] The end position.
   * @returns {Array} Returns the slice of `array`.
   */
  function baseSlice(array, start, end) {
    var index = -1,
        length = array.length;

    if (start < 0) {
      start = -start > length ? 0 : (length + start);
    }
    end = end > length ? length : end;
    if (end < 0) {
      end += length;
    }
    length = start > end ? 0 : ((end - start) >>> 0);
    start >>>= 0;

    var result = Array(length);
    while (++index < length) {
      result[index] = array[index + start];
    }
    return result;
  }

  var _baseSlice = baseSlice;

  /**
   * Casts `array` to a slice if it's needed.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {number} start The start position.
   * @param {number} [end=array.length] The end position.
   * @returns {Array} Returns the cast slice.
   */
  function castSlice(array, start, end) {
    var length = array.length;
    end = end === undefined ? length : end;
    return (!start && end >= length) ? array : _baseSlice(array, start, end);
  }

  var _castSlice = castSlice;

  /** Used to compose unicode character classes. */
  var rsAstralRange$1 = '\\ud800-\\udfff',
      rsComboMarksRange$1 = '\\u0300-\\u036f',
      reComboHalfMarksRange$1 = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange$1 = '\\u20d0-\\u20ff',
      rsComboRange$1 = rsComboMarksRange$1 + reComboHalfMarksRange$1 + rsComboSymbolsRange$1,
      rsVarRange$1 = '\\ufe0e\\ufe0f';

  /** Used to compose unicode capture groups. */
  var rsZWJ$1 = '\\u200d';

  /** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
  var reHasUnicode = RegExp('[' + rsZWJ$1 + rsAstralRange$1  + rsComboRange$1 + rsVarRange$1 + ']');

  /**
   * Checks if `string` contains Unicode symbols.
   *
   * @private
   * @param {string} string The string to inspect.
   * @returns {boolean} Returns `true` if a symbol is found, else `false`.
   */
  function hasUnicode(string) {
    return reHasUnicode.test(string);
  }

  var _hasUnicode = hasUnicode;

  /**
   * Converts an ASCII `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function asciiToArray(string) {
    return string.split('');
  }

  var _asciiToArray = asciiToArray;

  /** Used to compose unicode character classes. */
  var rsAstralRange = '\\ud800-\\udfff',
      rsComboMarksRange = '\\u0300-\\u036f',
      reComboHalfMarksRange = '\\ufe20-\\ufe2f',
      rsComboSymbolsRange = '\\u20d0-\\u20ff',
      rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
      rsVarRange = '\\ufe0e\\ufe0f';

  /** Used to compose unicode capture groups. */
  var rsAstral = '[' + rsAstralRange + ']',
      rsCombo = '[' + rsComboRange + ']',
      rsFitz = '\\ud83c[\\udffb-\\udfff]',
      rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
      rsNonAstral = '[^' + rsAstralRange + ']',
      rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
      rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
      rsZWJ = '\\u200d';

  /** Used to compose unicode regexes. */
  var reOptMod = rsModifier + '?',
      rsOptVar = '[' + rsVarRange + ']?',
      rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
      rsSeq = rsOptVar + reOptMod + rsOptJoin,
      rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

  /** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
  var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

  /**
   * Converts a Unicode `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function unicodeToArray(string) {
    return string.match(reUnicode) || [];
  }

  var _unicodeToArray = unicodeToArray;

  /**
   * Converts `string` to an array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the converted array.
   */
  function stringToArray(string) {
    return _hasUnicode(string)
      ? _unicodeToArray(string)
      : _asciiToArray(string);
  }

  var _stringToArray = stringToArray;

  /**
   * Creates a function like `_.lowerFirst`.
   *
   * @private
   * @param {string} methodName The name of the `String` case method to use.
   * @returns {Function} Returns the new case function.
   */
  function createCaseFirst(methodName) {
    return function(string) {
      string = toString_1(string);

      var strSymbols = _hasUnicode(string)
        ? _stringToArray(string)
        : undefined;

      var chr = strSymbols
        ? strSymbols[0]
        : string.charAt(0);

      var trailing = strSymbols
        ? _castSlice(strSymbols, 1).join('')
        : string.slice(1);

      return chr[methodName]() + trailing;
    };
  }

  var _createCaseFirst = createCaseFirst;

  /**
   * Converts the first character of `string` to upper case.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category String
   * @param {string} [string=''] The string to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.upperFirst('fred');
   * // => 'Fred'
   *
   * _.upperFirst('FRED');
   * // => 'FRED'
   */
  var upperFirst = _createCaseFirst('toUpperCase');

  var upperFirst_1 = upperFirst;

  /**
   * Converts the first character of `string` to upper case and the remaining
   * to lower case.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to capitalize.
   * @returns {string} Returns the capitalized string.
   * @example
   *
   * _.capitalize('FRED');
   * // => 'Fred'
   */
  function capitalize(string) {
    return upperFirst_1(toString_1(string).toLowerCase());
  }

  var capitalize_1 = capitalize;

  /**
   * Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category String
   * @param {string} [string=''] The string to convert.
   * @returns {string} Returns the camel cased string.
   * @example
   *
   * _.camelCase('Foo Bar');
   * // => 'fooBar'
   *
   * _.camelCase('--foo-bar--');
   * // => 'fooBar'
   *
   * _.camelCase('__FOO_BAR__');
   * // => 'fooBar'
   */
  var camelCase = _createCompounder(function(result, word, index) {
    word = word.toLowerCase();
    return result + (index ? capitalize_1(word) : word);
  });

  var camelCase_1 = camelCase;

  /**
   * The opposite of `_.mapValues`; this method creates an object with the
   * same values as `object` and keys generated by running each own enumerable
   * string keyed property of `object` thru `iteratee`. The iteratee is invoked
   * with three arguments: (value, key, object).
   *
   * @static
   * @memberOf _
   * @since 3.8.0
   * @category Object
   * @param {Object} object The object to iterate over.
   * @param {Function} [iteratee=_.identity] The function invoked per iteration.
   * @returns {Object} Returns the new mapped object.
   * @see _.mapValues
   * @example
   *
   * _.mapKeys({ 'a': 1, 'b': 2 }, function(value, key) {
   *   return key + value;
   * });
   * // => { 'a1': 1, 'b2': 2 }
   */
  function mapKeys(object, iteratee) {
    var result = {};
    iteratee = _baseIteratee(iteratee);

    _baseForOwn(object, function(value, key, object) {
      _baseAssignValue(result, iteratee(value, key, object), value);
    });
    return result;
  }

  var mapKeys_1 = mapKeys;

  /**
   * Topological sorting function
   *
   * @param {Array} edges
   * @returns {Array}
   */

  var toposort_1 = function(edges) {
    return toposort(uniqueNodes(edges), edges)
  };

  var array = toposort;

  function toposort(nodes, edges) {
    var cursor = nodes.length
      , sorted = new Array(cursor)
      , visited = {}
      , i = cursor
      // Better data structures make algorithm much faster.
      , outgoingEdges = makeOutgoingEdges(edges)
      , nodesHash = makeNodesHash(nodes);

    // check for unknown nodes
    edges.forEach(function(edge) {
      if (!nodesHash.has(edge[0]) || !nodesHash.has(edge[1])) {
        throw new Error('Unknown node. There is an unknown node in the supplied edges.')
      }
    });

    while (i--) {
      if (!visited[i]) visit(nodes[i], i, new Set());
    }

    return sorted

    function visit(node, i, predecessors) {
      if(predecessors.has(node)) {
        var nodeRep;
        try {
          nodeRep = ", node was:" + JSON.stringify(node);
        } catch(e) {
          nodeRep = "";
        }
        throw new Error('Cyclic dependency' + nodeRep)
      }

      if (!nodesHash.has(node)) {
        throw new Error('Found unknown node. Make sure to provided all involved nodes. Unknown node: '+JSON.stringify(node))
      }

      if (visited[i]) return;
      visited[i] = true;

      var outgoing = outgoingEdges.get(node) || new Set();
      outgoing = Array.from(outgoing);

      if (i = outgoing.length) {
        predecessors.add(node);
        do {
          var child = outgoing[--i];
          visit(child, nodesHash.get(child), predecessors);
        } while (i)
        predecessors.delete(node);
      }

      sorted[--cursor] = node;
    }
  }

  function uniqueNodes(arr){
    var res = new Set();
    for (var i = 0, len = arr.length; i < len; i++) {
      var edge = arr[i];
      res.add(edge[0]);
      res.add(edge[1]);
    }
    return Array.from(res)
  }

  function makeOutgoingEdges(arr){
    var edges = new Map();
    for (var i = 0, len = arr.length; i < len; i++) {
      var edge = arr[i];
      if (!edges.has(edge[0])) edges.set(edge[0], new Set());
      if (!edges.has(edge[1])) edges.set(edge[1], new Set());
      edges.get(edge[0]).add(edge[1]);
    }
    return edges
  }

  function makeNodesHash(arr){
    var res = new Map();
    for (var i = 0, len = arr.length; i < len; i++) {
      res.set(arr[i], i);
    }
    return res
  }
  toposort_1.array = array;

  function sortFields(fields, excludes = []) {
    let edges = [];
    let nodes = [];

    function addNode(depPath, key) {
      var node = propertyExpr.split(depPath)[0];
      if (!~nodes.indexOf(node)) nodes.push(node);
      if (!~excludes.indexOf(`${key}-${node}`)) edges.push([key, node]);
    }

    for (const key in fields) if (has_1(fields, key)) {
      let value = fields[key];
      if (!~nodes.indexOf(key)) nodes.push(key);
      if (Reference.isRef(value) && value.isSibling) addNode(value.path, key);else if (isSchema(value) && 'deps' in value) value.deps.forEach(path => addNode(path, key));
    }

    return toposort_1.array(nodes, edges).reverse();
  }

  function findIndex(arr, err) {
    let idx = Infinity;
    arr.some((key, ii) => {
      var _err$path;

      if (((_err$path = err.path) == null ? void 0 : _err$path.indexOf(key)) !== -1) {
        idx = ii;
        return true;
      }
    });
    return idx;
  }

  function sortByKeyOrder(keys) {
    return (a, b) => {
      return findIndex(keys, a) - findIndex(keys, b);
    };
  }

  function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

  let isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';

  function unknown(ctx, value) {
    let known = Object.keys(ctx.fields);
    return Object.keys(value).filter(key => known.indexOf(key) === -1);
  }

  const defaultSort = sortByKeyOrder([]);
  class ObjectSchema extends BaseSchema {
    constructor(spec) {
      super({
        type: 'object'
      });
      this.fields = Object.create(null);
      this._sortErrors = defaultSort;
      this._nodes = [];
      this._excludedEdges = [];
      this.withMutation(() => {
        this.transform(function coerce(value) {
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (err) {
              value = null;
            }
          }

          if (this.isType(value)) return value;
          return null;
        });

        if (spec) {
          this.shape(spec);
        }
      });
    }

    _typeCheck(value) {
      return isObject(value) || typeof value === 'function';
    }

    _cast(_value, options = {}) {
      var _options$stripUnknown;

      let value = super._cast(_value, options); //should ignore nulls here


      if (value === undefined) return this.getDefault();
      if (!this._typeCheck(value)) return value;
      let fields = this.fields;
      let strip = (_options$stripUnknown = options.stripUnknown) != null ? _options$stripUnknown : this.spec.noUnknown;

      let props = this._nodes.concat(Object.keys(value).filter(v => this._nodes.indexOf(v) === -1));

      let intermediateValue = {}; // is filled during the transform below

      let innerOptions = _extends({}, options, {
        parent: intermediateValue,
        __validating: options.__validating || false
      });

      let isChanged = false;

      for (const prop of props) {
        let field = fields[prop];
        let exists = has_1(value, prop);

        if (field) {
          let fieldValue;
          let inputValue = value[prop]; // safe to mutate since this is fired in sequence

          innerOptions.path = (options.path ? `${options.path}.` : '') + prop; // innerOptions.value = value[prop];

          field = field.resolve({
            value: inputValue,
            context: options.context,
            parent: intermediateValue
          });
          let fieldSpec = 'spec' in field ? field.spec : undefined;
          let strict = fieldSpec == null ? void 0 : fieldSpec.strict;

          if (fieldSpec == null ? void 0 : fieldSpec.strip) {
            isChanged = isChanged || prop in value;
            continue;
          }

          fieldValue = !options.__validating || !strict ? // TODO: use _cast, this is double resolving
          field.cast(value[prop], innerOptions) : value[prop];

          if (fieldValue !== undefined) {
            intermediateValue[prop] = fieldValue;
          }
        } else if (exists && !strip) {
          intermediateValue[prop] = value[prop];
        }

        if (intermediateValue[prop] !== value[prop]) {
          isChanged = true;
        }
      }

      return isChanged ? intermediateValue : value;
    }

    _validate(_value, opts = {}, callback) {
      let errors = [];
      let {
        sync,
        from = [],
        originalValue = _value,
        abortEarly = this.spec.abortEarly,
        recursive = this.spec.recursive
      } = opts;
      from = [{
        schema: this,
        value: originalValue
      }, ...from]; // this flag is needed for handling `strict` correctly in the context of
      // validation vs just casting. e.g strict() on a field is only used when validating

      opts.__validating = true;
      opts.originalValue = originalValue;
      opts.from = from;

      super._validate(_value, opts, (err, value) => {
        if (err) {
          if (!ValidationError.isError(err) || abortEarly) {
            return void callback(err, value);
          }

          errors.push(err);
        }

        if (!recursive || !isObject(value)) {
          callback(errors[0] || null, value);
          return;
        }

        originalValue = originalValue || value;

        let tests = this._nodes.map(key => (_, cb) => {
          let path = key.indexOf('.') === -1 ? (opts.path ? `${opts.path}.` : '') + key : `${opts.path || ''}["${key}"]`;
          let field = this.fields[key];

          if (field && 'validate' in field) {
            field.validate(value[key], _extends({}, opts, {
              // @ts-ignore
              path,
              from,
              // inner fields are always strict:
              // 1. this isn't strict so the casting will also have cast inner values
              // 2. this is strict in which case the nested values weren't cast either
              strict: true,
              parent: value,
              originalValue: originalValue[key]
            }), cb);
            return;
          }

          cb(null);
        });

        runTests({
          sync,
          tests,
          value,
          errors,
          endEarly: abortEarly,
          sort: this._sortErrors,
          path: opts.path
        }, callback);
      });
    }

    clone(spec) {
      const next = super.clone(spec);
      next.fields = _extends({}, this.fields);
      next._nodes = this._nodes;
      next._excludedEdges = this._excludedEdges;
      next._sortErrors = this._sortErrors;
      return next;
    }

    concat(schema) {
      let next = super.concat(schema);
      let nextFields = next.fields;

      for (let [field, schemaOrRef] of Object.entries(this.fields)) {
        const target = nextFields[field];

        if (target === undefined) {
          nextFields[field] = schemaOrRef;
        } else if (target instanceof BaseSchema && schemaOrRef instanceof BaseSchema) {
          nextFields[field] = schemaOrRef.concat(target);
        }
      }

      return next.withMutation(() => next.shape(nextFields));
    }

    getDefaultFromShape() {
      let dft = {};

      this._nodes.forEach(key => {
        const field = this.fields[key];
        dft[key] = 'default' in field ? field.getDefault() : undefined;
      });

      return dft;
    }

    _getDefault() {
      if ('default' in this.spec) {
        return super._getDefault();
      } // if there is no default set invent one


      if (!this._nodes.length) {
        return undefined;
      }

      return this.getDefaultFromShape();
    }

    shape(additions, excludes = []) {
      let next = this.clone();
      let fields = Object.assign(next.fields, additions);
      next.fields = fields;
      next._sortErrors = sortByKeyOrder(Object.keys(fields));

      if (excludes.length) {
        if (!Array.isArray(excludes[0])) excludes = [excludes];
        let keys = excludes.map(([first, second]) => `${first}-${second}`);
        next._excludedEdges = next._excludedEdges.concat(keys);
      }

      next._nodes = sortFields(fields, next._excludedEdges);
      return next;
    }

    pick(keys) {
      const picked = {};

      for (const key of keys) {
        if (this.fields[key]) picked[key] = this.fields[key];
      }

      return this.clone().withMutation(next => {
        next.fields = {};
        return next.shape(picked);
      });
    }

    omit(keys) {
      const next = this.clone();
      const fields = next.fields;
      next.fields = {};

      for (const key of keys) {
        delete fields[key];
      }

      return next.withMutation(() => next.shape(fields));
    }

    from(from, to, alias) {
      let fromGetter = propertyExpr.getter(from, true);
      return this.transform(obj => {
        if (obj == null) return obj;
        let newObj = obj;

        if (has_1(obj, from)) {
          newObj = _extends({}, obj);
          if (!alias) delete newObj[from];
          newObj[to] = fromGetter(obj);
        }

        return newObj;
      });
    }

    noUnknown(noAllow = true, message = object.noUnknown) {
      if (typeof noAllow === 'string') {
        message = noAllow;
        noAllow = true;
      }

      let next = this.test({
        name: 'noUnknown',
        exclusive: true,
        message: message,

        test(value) {
          if (value == null) return true;
          const unknownKeys = unknown(this.schema, value);
          return !noAllow || unknownKeys.length === 0 || this.createError({
            params: {
              unknown: unknownKeys.join(', ')
            }
          });
        }

      });
      next.spec.noUnknown = noAllow;
      return next;
    }

    unknown(allow = true, message = object.noUnknown) {
      return this.noUnknown(!allow, message);
    }

    transformKeys(fn) {
      return this.transform(obj => obj && mapKeys_1(obj, (_, key) => fn(key)));
    }

    camelCase() {
      return this.transformKeys(camelCase_1);
    }

    snakeCase() {
      return this.transformKeys(snakeCase_1);
    }

    constantCase() {
      return this.transformKeys(key => snakeCase_1(key).toUpperCase());
    }

    describe() {
      let base = super.describe();
      base.fields = mapValues_1(this.fields, value => value.describe());
      return base;
    }

  }
  function create(spec) {
    return new ObjectSchema(spec);
  }
  create.prototype = ObjectSchema.prototype;

  /* global $ */
  // disable button if there are any errors - or submitting is true....

  /** given an array of two element arrays, return an object keyed by
   * the unique values in the first element.  the entries of the objects
   * will be an array of the second object.  Used to make dynamic select
   * widgets - choice can change depending on the value of the key
   * (e.g. strains depend on species) */
  var make_choices = function make_choices(values) {
    var choices = values.reduce(function (acc, x) {
      var _x = _slicedToArray(x, 2),
          key = _x[0],
          val = _x[1];

      if (!acc.hasOwnProperty(key)) {
        acc[key] = [];
      }

      acc[key] = [].concat(_toConsumableArray(acc[key]), [val]); //acc[key].push(val);

      return acc;
    }, {});
    return choices;
  };
  /** update the choices in a dropdrown control to reflect the select
  value in a parent widget (species and strains).  new options is list
  of objects with the keys 'value' and 'text'.  This version is used in
  the xls_validation form, does not flag the field as an error, and
  accepts a list of objects as new Options.
  */

  var update_choices = function update_choices(selectorID, parentID, newOptions) {
    var el = $("#".concat(selectorID)); //const previous_val = $(`#${selectorID} option:selected`).val();

    var previous_selection = $("#".concat(selectorID, " option:selected"));
    var previous_text = previous_selection.text();
    var previous_value = previous_selection.val();
    $("#".concat(parentID, " option:selected")).text();
    el.empty(); // remove old options
    // if the previous value is not in the current list, add it now:

    var was_previous = previous_value === "" || previous_value === "-999" ? true : previous_value;

    if (was_previous && newOptions.filter(function (x) {
      return x.value === previous_value;
    }).length === 0) {
      el.append($("<option>", {
        value: previous_value,
        text: previous_text
      }));
    }

    $.each(newOptions, function (i, item) {
      el.append($("<option>", {
        value: item.value,
        text: item.text
      }));
    }); // make sure the old value is selected.

    el.val(previous_value).find("option[value=\"".concat(previous_value, "\"]")).attr("selected", true);
  };
  // catch April 31, ect.
  // if the input is the same as the output we are good:

  var isValidDate = function isValidDate(year, month, day) {
    month = month - 1;
    var d = new Date(year, month, day);
    var now = new Date();

    if (d.getFullYear() == year && d.getMonth() == month && d.getDate() == day && d < now) {
      return true;
    }

    return false;
  };

  var render_field_errors = function render_field_errors(form_errors) {
    for (var _i = 0, _Object$entries = Object.entries(form_errors); _i < _Object$entries.length; _i++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
          fld = _Object$entries$_i[0],
          err = _Object$entries$_i[1];

      // set the error class on the field:
      var selector = "#".concat(fld, "-field");
      $(selector).addClass("error").attr("data-tooltip", err).attr("data-variation", "tiny basic");
    } // if form_errors has any elements update the error message and disable the submit button
    // if form_errors is empty - enable the submit button and remove the errors-count.


    var error_count = Object.keys(form_errors).length;

    if (error_count) {
      // select the submit button:
      $("#upload-events-button").prop("disabled", true);
      $("#form-errors-message").removeClass("form-valid-message").addClass("form-error-message").html("".concat(error_count, " Error").concat(error_count > 1 ? "s" : "", " Found."));
    } else {
      $("#upload-events-button").prop("disabled", false);
      $("#form-errors-message").removeClass("form-error-message").addClass("form-valid-message").html("No Errors Found");
    }
  };

  var get_choices = function get_choices(field_name) {
    var select = $("#id_form-0-".concat(field_name, " option"));
    var choices = $.map(select, function (x) {
      return x.value;
    });
    return choices;
  };

  var clear_row_field_errors = function clear_row_field_errors(row_prefix) {
    // given a row identifier, remove all of the errors in the row:
    $("#".concat(row_prefix, "-row :input")).each(function () {
      $(this).parents(".field").removeClass("error").removeAttr("data-tooltip").remove("data-variation");
    });
  };

  var get_row_values = function get_row_values(row_selector) {
    // row slector should be of the form 'id_form-8'
    var values = {};
    var row = $("#".concat(row_selector, "-row :input"));
    row.each(function () {
      values[$(this).attr("id").replace(row_selector + "-", "")] = $(this).val();
    });

    values.month = values.month === "" ? undefined : +values.month;
    values.day = values.day === "" ? undefined : +values.day;
    values.latitude = values.latitude === "" ? undefined : +values.latitude;
    values.longitude = values.longitude === "" ? undefined : +values.longitude;
    values.weight = values.weight ? +values.weight : undefined;
    return values;
  };
  var stateprov_choices = [];
  var statDist_choices = [];
  var grid10_choices = [];
  var species_choices = [];
  var strain_choices = [];
  var clipcode_choices = [];
  var lifestage_choices = [];
  var stocking_method_choices = []; // tags, marks, hatchery

  Promise.all([json("/api/v1/stocking/lookups"), json("/api/v1/common/lookups")]).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        stocking = _ref2[0],
        common = _ref2[1];

    // statDist, grid and strain are all objected keyed by their respective parents
    // state/prov choices keyed by lake
    // management unit choices keyed by lake/stat prov or jurisdiction
    // grid choices keyed by mu.
    // strain choices are keyed by species
    stateprov_choices = common.jurisdictions.filter(function (x) {
      return x.lake.abbrev === lake;
    }).map(function (d) {
      return {
        value: d.stateprov.abbrev,
        text: d.stateprov.name
      };
    });
    statDist_choices = make_choices(common.manUnits.filter(function (x) {
      return x.jurisdiction.lake.abbrev === lake;
    }).map(function (d) {
      return [d.jurisdiction.stateprov.abbrev, {
        value: d.label,
        text: d.label
      }];
    }));
    grid10_choices = make_choices(mu_grids.map(function (d) {
      return [d[0], {
        value: d[1],
        text: d[1]
      }];
    }));
    species_choices = common["species"].filter(function (d) {
      return d.active === true;
    }).map(function (x) {
      return x.abbrev;
    });
    clipcode_choices = common["clipcodes"].map(function (x) {
      return x.clip_code;
    });
    stocking_method_choices = stocking["stockingmethods"].map(function (x) {
      return x.stk_meth;
    });
    lifestage_choices = stocking["lifestages"].map(function (x) {
      return x.abbrev;
    });
    strain_choices = make_choices( // object keyed by species with array of 2 element arrays
    // strain code (strain label)
    common.raw_strains.filter(function (d) {
      return d.active === true;
    }).map(function (x) {
      //const label = `${x.raw_strain} (${x.description})`;
      return [x.species__abbrev, {
        value: x.raw_strain,
        text: x.raw_strain
      }];
    })); // choices for hatcheries, finclips, physchem_marks and tag_types can come from the first row
    // of our form - there is currently no api, and the values in those select widgets are complete
    // and consistent for all other rows:
    // const hatchery_select = $("#id_form-0-hatchery option");
    // const hatchery_choices = $.map(hatchery_select, function (x) {
    //   return x.value;
    // });
    //const finclip_choices = get_choices("finclip");

    var condition_choices = get_choices("condition");
    var physchem_mark_choices = get_choices("physchem_mark");
    var tag_type_choices = get_choices("tag_type");
    var hatchery_choices = get_choices("hatchery");

    var _lake_bbox = lake_bbox,
        _lake_bbox2 = _slicedToArray(_lake_bbox, 4),
        minLon = _lake_bbox2[0],
        minLat = _lake_bbox2[1],
        maxLon = _lake_bbox2[2],
        maxLat = _lake_bbox2[3];

    var cwt_regex = /^[0-9]{6}((,|;)[0-9]{6})*(,|;)?$/;
    var thisYear = new Date().getFullYear();
    var schema = create().shape({
      // stock_id: yup
      //   .number()
      //   .nullable(true)
      //   .transform((_, val) => (val === val ? val : null)),
      state_prov: create$2().required().oneOf(stateprov_choices.map(function (x) {
        return x.value;
      })),
      year: create$1().required("Year is required").positive("Year must be positive").min(1950, "Year must be after 1950").max(thisYear, "Year must be less than today (".concat(thisYear, ")")),
      month: create$1() //.required("Month is required")
      .nullable().positive("Month must be positive").min(1, "Month must be greater than or equal to 1").max(12, "Month must be less than or equal to 12").when("day", {
        is: function is(day) {
          return typeof day !== "undefined";
        },
        then: create$1().required("Month is required if day is provided"),
        otherwise: create$1().nullable(true)
      }),
      day: create$1().positive("Day must be positive").min(1, "Day must be greater than or equal to 1").max(31, "Day must be less than or equal to 31").nullable(true).test("is-valid-date", "day-month-year do not form a valide date.", function (value, context) {
        var _context$parent = context.parent,
            year = _context$parent.year,
            month = _context$parent.month;

        if (typeof month !== "undefined" & typeof value !== "undefined") {
          return isValidDate(year, month, value);
        } else {
          return true;
        }
      }),
      site: create$2().required(),
      st_site: create$2().nullable(true).transform(function (_, val) {
        return val === val ? val : null;
      }),
      latitude: create$1().when("longitude", {
        is: function is(longitude) {
          return typeof longitude !== "undefined" & longitude !== 0;
        },
        then: create$1().required("Latitude is required if Longitude is populated").min(minLat, "Latitude must be greater than ".concat(minLat.toFixed(3), " degrees")).max(maxLat, "Latitude must be less than ".concat(maxLat.toFixed(3), " degrees"))
      }),
      longitude: create$1().when("latitude", {
        is: function is(latitude) {
          return typeof latitude !== "undefined" & latitude !== 0;
        },
        then: create$1().required("Longitude is required if Latitude is populated").min(minLon, "Longitude must be negative and greater than ".concat(minLon.toFixed(3), " degrees")).max(maxLon, "Longitude must be negative and less than ".concat(maxLon.toFixed(3), " degrees"))
      }),
      stat_dist: create$2().required().when("state_prov", function (state_prov, schema) {
        if (create$2().oneOf(stateprov_choices.map(function (x) {
          return x.value;
        })).required().isValid(state_prov)) {
          return schema.oneOf(statDist_choices[state_prov].map(function (x) {
            return x.value;
          }), "not a valid stat_dist for ".concat(state_prov));
        }

        return schema;
      }),
      grid: create$2().required().when(["stat_dist", "state_prov"], function (stat_dist, state_prov, schema) {
        if (create$2().oneOf(statDist_choices[state_prov].map(function (x) {
          return x.value;
        })).required().isValid(stat_dist)) {
          return schema.oneOf(grid10_choices[stat_dist].map(function (x) {
            return x.value;
          }), "not a valid grid for ".concat(stat_dist));
        }

        return schema;
      }),
      species: create$2().required().oneOf(species_choices),
      strain: create$2().required().when("species", function (species, schema) {
        if (create$2().oneOf(species_choices).required().isValid(species)) {
          return schema.oneOf(strain_choices[species].map(function (x) {
            return x.value;
          }), "not a valid strain for ".concat(species));
        }

        return schema;
      }),
      no_stocked: create$1().required().positive("Ensure this value is greater than or equal to 1").integer(),
      // min and max
      year_class: create$1().required("Year Class is required").positive("Year Class must be positive").min(1950, "Year must be after 1945").max(thisYear, "Year Class must be less than today (".concat(thisYear, ")")),
      stage: create$2().oneOf([""].concat(_toConsumableArray(lifestage_choices)), "Unknown Lifestage.").required(),
      agemonth: create$1().positive().integer(),
      tag_no: create$2().matches(cwt_regex, {
        excludeEmptyString: true,
        message: "cwts must be exactly 6 digits separated by a comma or semicolon"
      }),
      tag_ret: create$1().nullable(true).typeError("Must be a valid number.").transform(function (value, originalValue) {
        return String(originalValue).trim() === "" ? null : value;
      }).positive(),
      length: create$1().nullable(true).typeError("Must be a valid number.").transform(function (value, originalValue) {
        return String(originalValue).trim() === "" ? null : value;
      }).min(1, "Length must be greater than or equal to 1").positive("Ensure this value is greater than or equal to 1"),
      weight: create$1().nullable(true).typeError("Must be a valid number.").transform(function (value, originalValue) {
        return String(originalValue).trim() === "" ? null : value;
      }).min(0.1, "Weight must be greater than or equal to 1").positive("Ensure this value is greater than or equal to 0.1"),
      condition: create$2().nullable(true).oneOf([""].concat(_toConsumableArray(condition_choices)), "Unknown Condition Code.").transform(function (_, val) {
        return val === val ? val : null;
      }),
      lot_code: create$2().nullable(true).transform(function (_, val) {
        return val === val ? val : null;
      }),
      stock_meth: create$2().oneOf([""].concat(_toConsumableArray(stocking_method_choices)), "Unknown Stocking Method."),
      notes: create$2().nullable(true).transform(function (_, val) {
        return val === val ? val : null;
      }),
      hatchery: create$2().transform(function (_, val) {
        return val === val ? val : null;
      }).oneOf([""].concat(_toConsumableArray(hatchery_choices)), "Unknown Hatchery Abbrev."),
      agency_stock_id: create$2().nullable(true).transform(function (_, val) {
        return val === val ? val : null;
      }),
      finclip: create$2().oneOf([""].concat(_toConsumableArray(clipcode_choices)), "Unknown Composite Clip Code").test("Clip contains BP", 'BP is not a valid Composite Clip. Did you mean "LPRP"', function (value) {
        return !/BP/.test(value);
      }).test("Clip contains BV", 'BV is not a valid Composite Clip. Did you mean "LVRV"', function (value) {
        return !/BV/.test(value);
      }),
      clip_efficiency: create$1().positive().nullable(true).transform(function (value, originalValue) {
        return String(originalValue).trim() === "" ? null : value;
      }),
      physchem_mark: create$2().nullable(true).oneOf([""].concat(_toConsumableArray(physchem_mark_choices)), "Unknown PhysChem Mark.").transform(function (_, val) {
        return val === val ? val : null;
      }),
      tag_type: create$2().nullable(true).oneOf([""].concat(_toConsumableArray(tag_type_choices)), "Unknown Tag Type.").transform(function (_, val) {
        return val === val ? val : null;
      })
    }, [["latitude", "longitude"], ["day"]]);

    var validate_values = /*#__PURE__*/function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regenerator.mark(function _callee(values) {
        var field_errors;
        return regenerator.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return schema.validate(values, {
                  abortEarly: false
                });

              case 3:
                _context.next = 8;
                break;

              case 5:
                _context.prev = 5;
                _context.t0 = _context["catch"](0);
                field_errors = _context.t0.inner.map(function (err) {
                  return {
                    field: err.path,
                    message: err.message
                  };
                });

              case 8:
                return _context.abrupt("return", field_errors);

              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[0, 5]]);
      }));

      return function validate_values(_x) {
        return _ref3.apply(this, arguments);
      };
    }();

    var validate_row = function validate_row(row_id) {
      var values = get_row_values(row_id);
      validate_values(values).then(function (valid) {
        // remove all of the errors in this row row:
        Object.keys(form_errors).filter(function (key) {
          return key.startsWith(row_id);
        }).forEach(function (key) {
          return delete form_errors[key];
        }); // ad any back in:

        if (Array.isArray(valid)) {
          valid.forEach(function (err) {
            return form_errors["".concat(row_id, "-").concat(err.field)] = [err.message];
          }); //add_row_error(row_id);

          $("#".concat(row_id, "-icon")).attr("class", "red arrow right icon");
          $("#".concat(row_id, "-row")).addClass("error");
        } else {
          // no errors
          //clear_row_error(row_id);
          $("#".concat(row_id, "-icon")).attr("class", "green check icon");
          $("#".concat(row_id, "-row")).removeClass("error");
        }

        clear_row_field_errors(row_id);
        render_field_errors(form_errors);
      });
    }; //==================
    //    ON LOAD
    // attach our row validate to the blur event of every input field


    $("#upload-form :input").blur(function (e) {
      var form_id_regex = /id_form-[0-9]+/;
      var row_prefix = e.target.id.match(form_id_regex)[0];
      validate_row(row_prefix);
    });
    $("#upload-form :input").change(function (e) {
      var form_id_regex = /id_form-[0-9]+/;
      var row_prefix = e.target.id.match(form_id_regex)[0];
      validate_row(row_prefix);
    }); //update the mangement unit, grid, and strain choices for each row
    //based on the value of their parent widgets in the same row

    $('select[id$="-state_prov"]').each(function (x) {
      var parent_id = this.id;
      var child_id = parent_id.replace("state_prov", "stat_dist");
      update_choices(child_id, parent_id, statDist_choices[this.value]);
    });
    $('select[id$="-stat_dist"]').each(function (x) {
      var parent_id = this.id;
      var child_id = parent_id.replace("stat_dist", "grid");
      update_choices(child_id, parent_id, grid10_choices[this.value]);
    }); //update the strain choices for each row based on the value in each species
    // loop over each one, get each id, build the strain id, and select the options from
    // the strain lookup:

    $('select[id$="-species"]').each(function (x) {
      var parent_id = this.id;
      var child_id = parent_id.replace("species", "strain");
      update_choices(child_id, parent_id, strain_choices[this.value]);
    }); //==================
    // ON CHANGE

    $('select[id$="-state_prov"]').change(function (x) {
      var parent_id = this.id;
      var child_id = parent_id.replace("state_prov", "stat_dist");
      update_choices(child_id, parent_id, statDist_choices[this.value]);
    });
    $('select[id$="-stat_dist"]').change(function (x) {
      var parent_id = this.id;
      var child_id = parent_id.replace("stat_dist", "grid");
      update_choices(child_id, parent_id, grid10_choices[this.value]);
    }); // if a species changes - update the available choice in the strain control:

    $('select[id$="-species"]').change(function () {
      var parent_id = this.id;
      var child_id = parent_id.replace("species", "strain");
      update_choices(child_id, parent_id, strain_choices[this.value]);
    }); // on load, loop over all of the rows, validate the data and update the form errors dictionary
    // then update the display to show the errors.

    var events = $("#upload-form tbody tr").map(function () {
      return $(this).attr("id").replace("-row", "");
    });
    events.get().forEach(function (row_id) {
      validate_row(row_id);
    }); // we will need fucntions to:
    // manage form_errors:
    // + add field
    // + remove field
    // delete if array is null
  });

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoieGxzeF9ldmVudF92YWxpZGF0aW9uLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vYXN5bmNUb0dlbmVyYXRvci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9hcnJheUxpa2VUb0FycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2FycmF5V2l0aG91dEhvbGVzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0BiYWJlbC9ydW50aW1lL2hlbHBlcnMvZXNtL2l0ZXJhYmxlVG9BcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9ub25JdGVyYWJsZVNwcmVhZC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS90b0NvbnN1bWFibGVBcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9hcnJheVdpdGhIb2xlcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9pdGVyYWJsZVRvQXJyYXlMaW1pdC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9AYmFiZWwvcnVudGltZS9oZWxwZXJzL2VzbS9ub25JdGVyYWJsZVJlc3QuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvaGVscGVycy9lc20vc2xpY2VkVG9BcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9yZWdlbmVyYXRvci1ydW50aW1lL3J1bnRpbWUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQGJhYmVsL3J1bnRpbWUvcmVnZW5lcmF0b3IvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtYXJyYXkvc3JjL2FzY2VuZGluZy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1hcnJheS9zcmMvYmlzZWN0b3IuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtYXJyYXkvc3JjL2Jpc2VjdC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1kaXNwYXRjaC9zcmMvZGlzcGF0Y2guanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtYnJ1c2gvbm9kZV9tb2R1bGVzL2QzLXRyYW5zaXRpb24vc3JjL3RyYW5zaXRpb24vc2NoZWR1bGUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvZDMtY29sbGVjdGlvbi9zcmMvbWFwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2QzLWNvbGxlY3Rpb24vc3JjL3NldC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy1mZXRjaC9zcmMvanNvbi5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy9ub2RlX21vZHVsZXMvZDMtdHJhbnNpdGlvbi9zcmMvdHJhbnNpdGlvbi9zY2hlZHVsZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9kMy16b29tL25vZGVfbW9kdWxlcy9kMy10cmFuc2l0aW9uL3NyYy90cmFuc2l0aW9uL3NjaGVkdWxlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL25hbm9jbG9uZS9zcmMvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL3V0aWwvcHJpbnRWYWx1ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy95dXAvZXMvbG9jYWxlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUhhcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvaXNBcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2ZyZWVHbG9iYWwuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19yb290LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fU3ltYm9sLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0UmF3VGFnLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fb2JqZWN0VG9TdHJpbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0VGFnLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc09iamVjdExpa2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzU3ltYm9sLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9faXNLZXkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzT2JqZWN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc0Z1bmN0aW9uLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fY29yZUpzRGF0YS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2lzTWFza2VkLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fdG9Tb3VyY2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlSXNOYXRpdmUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19nZXRWYWx1ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2dldE5hdGl2ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX25hdGl2ZUNyZWF0ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2hhc2hDbGVhci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2hhc2hEZWxldGUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19oYXNoR2V0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9faGFzaEhhcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2hhc2hTZXQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19IYXNoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbGlzdENhY2hlQ2xlYXIuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2VxLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYXNzb2NJbmRleE9mLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbGlzdENhY2hlRGVsZXRlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbGlzdENhY2hlR2V0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbGlzdENhY2hlSGFzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbGlzdENhY2hlU2V0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fTGlzdENhY2hlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fTWFwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbWFwQ2FjaGVDbGVhci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2lzS2V5YWJsZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2dldE1hcERhdGEuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19tYXBDYWNoZURlbGV0ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX21hcENhY2hlR2V0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbWFwQ2FjaGVIYXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19tYXBDYWNoZVNldC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX01hcENhY2hlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9tZW1vaXplLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbWVtb2l6ZUNhcHBlZC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3N0cmluZ1RvUGF0aC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2FycmF5TWFwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVRvU3RyaW5nLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC90b1N0cmluZy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Nhc3RQYXRoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUlzQXJndW1lbnRzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FyZ3VtZW50cy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2lzSW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzTGVuZ3RoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fdG9LZXkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19oYXNQYXRoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9oYXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL3V0aWwvaXNTY2hlbWEuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL0NvbmRpdGlvbi5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy95dXAvZXMvdXRpbC90b0FycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3l1cC9lcy9WYWxpZGF0aW9uRXJyb3IuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL3V0aWwvcnVuVGVzdHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19kZWZpbmVQcm9wZXJ0eS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VBc3NpZ25WYWx1ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2NyZWF0ZUJhc2VGb3IuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlRm9yLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVRpbWVzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9zdHViRmFsc2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2lzQnVmZmVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUlzVHlwZWRBcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VVbmFyeS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX25vZGVVdGlsLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc1R5cGVkQXJyYXkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19hcnJheUxpa2VLZXlzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9faXNQcm90b3R5cGUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19vdmVyQXJnLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbmF0aXZlS2V5cy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VLZXlzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9pc0FycmF5TGlrZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gva2V5cy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VGb3JPd24uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19zdGFja0NsZWFyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fc3RhY2tEZWxldGUuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19zdGFja0dldC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3N0YWNrSGFzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fc3RhY2tTZXQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19TdGFjay5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3NldENhY2hlQWRkLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fc2V0Q2FjaGVIYXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19TZXRDYWNoZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2FycmF5U29tZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2NhY2hlSGFzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fZXF1YWxBcnJheXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19VaW50OEFycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fbWFwVG9BcnJheS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3NldFRvQXJyYXkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19lcXVhbEJ5VGFnLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYXJyYXlQdXNoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUdldEFsbEtleXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19hcnJheUZpbHRlci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvc3R1YkFycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0U3ltYm9scy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2dldEFsbEtleXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19lcXVhbE9iamVjdHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19EYXRhVmlldy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX1Byb21pc2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19TZXQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19XZWFrTWFwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fZ2V0VGFnLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUlzRXF1YWxEZWVwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZUlzRXF1YWwuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlSXNNYXRjaC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2lzU3RyaWN0Q29tcGFyYWJsZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2dldE1hdGNoRGF0YS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX21hdGNoZXNTdHJpY3RDb21wYXJhYmxlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZU1hdGNoZXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlR2V0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9nZXQuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlSGFzSW4uanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2hhc0luLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZU1hdGNoZXNQcm9wZXJ0eS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvaWRlbnRpdHkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlUHJvcGVydHkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlUHJvcGVydHlEZWVwLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9wcm9wZXJ0eS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2Jhc2VJdGVyYXRlZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvbWFwVmFsdWVzLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Byb3BlcnR5LWV4cHIvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL1JlZmVyZW5jZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy95dXAvZXMvdXRpbC9jcmVhdGVWYWxpZGF0aW9uLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3l1cC9lcy91dGlsL3JlYWNoLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3l1cC9lcy91dGlsL1JlZmVyZW5jZVNldC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy95dXAvZXMvc2NoZW1hLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3l1cC9lcy91dGlsL2lzQWJzZW50LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3l1cC9lcy9zdHJpbmcuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL251bWJlci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2FycmF5UmVkdWNlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYmFzZVByb3BlcnR5T2YuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19kZWJ1cnJMZXR0ZXIuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL2RlYnVyci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX2FzY2lpV29yZHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19oYXNVbmljb2RlV29yZC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvX3VuaWNvZGVXb3Jkcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9sb2Rhc2gvd29yZHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19jcmVhdGVDb21wb3VuZGVyLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9zbmFrZUNhc2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19iYXNlU2xpY2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19jYXN0U2xpY2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19oYXNVbmljb2RlLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fYXNjaWlUb0FycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fdW5pY29kZVRvQXJyYXkuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL19zdHJpbmdUb0FycmF5LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9fY3JlYXRlQ2FzZUZpcnN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC91cHBlckZpcnN0LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9jYXBpdGFsaXplLmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2xvZGFzaC9jYW1lbENhc2UuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoL21hcEtleXMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdG9wb3NvcnQvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMveXVwL2VzL3V0aWwvc29ydEZpZWxkcy5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy95dXAvZXMvdXRpbC9zb3J0QnlLZXlPcmRlci5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy95dXAvZXMvb2JqZWN0LmpzIiwiLi4vLi4vanNfc3JjL2NvbXBvbmVudHMvZm9ybV91dGlscy5qcyIsIi4uLy4uL2pzX3NyYy94bHN4X2V2ZW50X3ZhbGlkYXRpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gYXN5bmNHZW5lcmF0b3JTdGVwKGdlbiwgcmVzb2x2ZSwgcmVqZWN0LCBfbmV4dCwgX3Rocm93LCBrZXksIGFyZykge1xuICB0cnkge1xuICAgIHZhciBpbmZvID0gZ2VuW2tleV0oYXJnKTtcbiAgICB2YXIgdmFsdWUgPSBpbmZvLnZhbHVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJlamVjdChlcnJvcik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGluZm8uZG9uZSkge1xuICAgIHJlc29sdmUodmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIFByb21pc2UucmVzb2x2ZSh2YWx1ZSkudGhlbihfbmV4dCwgX3Rocm93KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfYXN5bmNUb0dlbmVyYXRvcihmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIGdlbiA9IGZuLmFwcGx5KHNlbGYsIGFyZ3MpO1xuXG4gICAgICBmdW5jdGlvbiBfbmV4dCh2YWx1ZSkge1xuICAgICAgICBhc3luY0dlbmVyYXRvclN0ZXAoZ2VuLCByZXNvbHZlLCByZWplY3QsIF9uZXh0LCBfdGhyb3csIFwibmV4dFwiLCB2YWx1ZSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIF90aHJvdyhlcnIpIHtcbiAgICAgICAgYXN5bmNHZW5lcmF0b3JTdGVwKGdlbiwgcmVzb2x2ZSwgcmVqZWN0LCBfbmV4dCwgX3Rocm93LCBcInRocm93XCIsIGVycik7XG4gICAgICB9XG5cbiAgICAgIF9uZXh0KHVuZGVmaW5lZCk7XG4gICAgfSk7XG4gIH07XG59IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX2FycmF5TGlrZVRvQXJyYXkoYXJyLCBsZW4pIHtcbiAgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBuZXcgQXJyYXkobGVuKTsgaSA8IGxlbjsgaSsrKSB7XG4gICAgYXJyMltpXSA9IGFycltpXTtcbiAgfVxuXG4gIHJldHVybiBhcnIyO1xufSIsImltcG9ydCBhcnJheUxpa2VUb0FycmF5IGZyb20gXCIuL2FycmF5TGlrZVRvQXJyYXkuanNcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgcmV0dXJuIGFycmF5TGlrZVRvQXJyYXkoYXJyKTtcbn0iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5KGl0ZXIpIHtcbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09IFwidW5kZWZpbmVkXCIgJiYgU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChpdGVyKSkgcmV0dXJuIEFycmF5LmZyb20oaXRlcik7XG59IiwiaW1wb3J0IGFycmF5TGlrZVRvQXJyYXkgZnJvbSBcIi4vYXJyYXlMaWtlVG9BcnJheS5qc1wiO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KG8sIG1pbkxlbikge1xuICBpZiAoIW8pIHJldHVybjtcbiAgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSByZXR1cm4gYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pO1xuICB2YXIgbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSk7XG4gIGlmIChuID09PSBcIk9iamVjdFwiICYmIG8uY29uc3RydWN0b3IpIG4gPSBvLmNvbnN0cnVjdG9yLm5hbWU7XG4gIGlmIChuID09PSBcIk1hcFwiIHx8IG4gPT09IFwiU2V0XCIpIHJldHVybiBBcnJheS5mcm9tKG8pO1xuICBpZiAobiA9PT0gXCJBcmd1bWVudHNcIiB8fCAvXig/OlVpfEkpbnQoPzo4fDE2fDMyKSg/OkNsYW1wZWQpP0FycmF5JC8udGVzdChuKSkgcmV0dXJuIGFycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcbn0iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfbm9uSXRlcmFibGVTcHJlYWQoKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gc3ByZWFkIG5vbi1pdGVyYWJsZSBpbnN0YW5jZS5cXG5JbiBvcmRlciB0byBiZSBpdGVyYWJsZSwgbm9uLWFycmF5IG9iamVjdHMgbXVzdCBoYXZlIGEgW1N5bWJvbC5pdGVyYXRvcl0oKSBtZXRob2QuXCIpO1xufSIsImltcG9ydCBhcnJheVdpdGhvdXRIb2xlcyBmcm9tIFwiLi9hcnJheVdpdGhvdXRIb2xlcy5qc1wiO1xuaW1wb3J0IGl0ZXJhYmxlVG9BcnJheSBmcm9tIFwiLi9pdGVyYWJsZVRvQXJyYXkuanNcIjtcbmltcG9ydCB1bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheSBmcm9tIFwiLi91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheS5qc1wiO1xuaW1wb3J0IG5vbkl0ZXJhYmxlU3ByZWFkIGZyb20gXCIuL25vbkl0ZXJhYmxlU3ByZWFkLmpzXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7XG4gIHJldHVybiBhcnJheVdpdGhvdXRIb2xlcyhhcnIpIHx8IGl0ZXJhYmxlVG9BcnJheShhcnIpIHx8IHVuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KGFycikgfHwgbm9uSXRlcmFibGVTcHJlYWQoKTtcbn0iLCJleHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBfYXJyYXlXaXRoSG9sZXMoYXJyKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBhcnI7XG59IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gX2l0ZXJhYmxlVG9BcnJheUxpbWl0KGFyciwgaSkge1xuICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkpIHJldHVybjtcbiAgdmFyIF9hcnIgPSBbXTtcbiAgdmFyIF9uID0gdHJ1ZTtcbiAgdmFyIF9kID0gZmFsc2U7XG4gIHZhciBfZSA9IHVuZGVmaW5lZDtcblxuICB0cnkge1xuICAgIGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHtcbiAgICAgIF9hcnIucHVzaChfcy52YWx1ZSk7XG5cbiAgICAgIGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhaztcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIF9kID0gdHJ1ZTtcbiAgICBfZSA9IGVycjtcbiAgfSBmaW5hbGx5IHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSAhPSBudWxsKSBfaVtcInJldHVyblwiXSgpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBpZiAoX2QpIHRocm93IF9lO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBfYXJyO1xufSIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9ub25JdGVyYWJsZVJlc3QoKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlLlxcbkluIG9yZGVyIHRvIGJlIGl0ZXJhYmxlLCBub24tYXJyYXkgb2JqZWN0cyBtdXN0IGhhdmUgYSBbU3ltYm9sLml0ZXJhdG9yXSgpIG1ldGhvZC5cIik7XG59IiwiaW1wb3J0IGFycmF5V2l0aEhvbGVzIGZyb20gXCIuL2FycmF5V2l0aEhvbGVzLmpzXCI7XG5pbXBvcnQgaXRlcmFibGVUb0FycmF5TGltaXQgZnJvbSBcIi4vaXRlcmFibGVUb0FycmF5TGltaXQuanNcIjtcbmltcG9ydCB1bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheSBmcm9tIFwiLi91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheS5qc1wiO1xuaW1wb3J0IG5vbkl0ZXJhYmxlUmVzdCBmcm9tIFwiLi9ub25JdGVyYWJsZVJlc3QuanNcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIF9zbGljZWRUb0FycmF5KGFyciwgaSkge1xuICByZXR1cm4gYXJyYXlXaXRoSG9sZXMoYXJyKSB8fCBpdGVyYWJsZVRvQXJyYXlMaW1pdChhcnIsIGkpIHx8IHVuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KGFyciwgaSkgfHwgbm9uSXRlcmFibGVSZXN0KCk7XG59IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgcnVudGltZSA9IChmdW5jdGlvbiAoZXhwb3J0cykge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgT3AgPSBPYmplY3QucHJvdG90eXBlO1xuICB2YXIgaGFzT3duID0gT3AuaGFzT3duUHJvcGVydHk7XG4gIHZhciB1bmRlZmluZWQ7IC8vIE1vcmUgY29tcHJlc3NpYmxlIHRoYW4gdm9pZCAwLlxuICB2YXIgJFN5bWJvbCA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiA/IFN5bWJvbCA6IHt9O1xuICB2YXIgaXRlcmF0b3JTeW1ib2wgPSAkU3ltYm9sLml0ZXJhdG9yIHx8IFwiQEBpdGVyYXRvclwiO1xuICB2YXIgYXN5bmNJdGVyYXRvclN5bWJvbCA9ICRTeW1ib2wuYXN5bmNJdGVyYXRvciB8fCBcIkBAYXN5bmNJdGVyYXRvclwiO1xuICB2YXIgdG9TdHJpbmdUYWdTeW1ib2wgPSAkU3ltYm9sLnRvU3RyaW5nVGFnIHx8IFwiQEB0b1N0cmluZ1RhZ1wiO1xuXG4gIGZ1bmN0aW9uIGRlZmluZShvYmosIGtleSwgdmFsdWUpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHtcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiBvYmpba2V5XTtcbiAgfVxuICB0cnkge1xuICAgIC8vIElFIDggaGFzIGEgYnJva2VuIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSB0aGF0IG9ubHkgd29ya3Mgb24gRE9NIG9iamVjdHMuXG4gICAgZGVmaW5lKHt9LCBcIlwiKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgZGVmaW5lID0gZnVuY3Rpb24ob2JqLCBrZXksIHZhbHVlKSB7XG4gICAgICByZXR1cm4gb2JqW2tleV0gPSB2YWx1ZTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gd3JhcChpbm5lckZuLCBvdXRlckZuLCBzZWxmLCB0cnlMb2NzTGlzdCkge1xuICAgIC8vIElmIG91dGVyRm4gcHJvdmlkZWQgYW5kIG91dGVyRm4ucHJvdG90eXBlIGlzIGEgR2VuZXJhdG9yLCB0aGVuIG91dGVyRm4ucHJvdG90eXBlIGluc3RhbmNlb2YgR2VuZXJhdG9yLlxuICAgIHZhciBwcm90b0dlbmVyYXRvciA9IG91dGVyRm4gJiYgb3V0ZXJGbi5wcm90b3R5cGUgaW5zdGFuY2VvZiBHZW5lcmF0b3IgPyBvdXRlckZuIDogR2VuZXJhdG9yO1xuICAgIHZhciBnZW5lcmF0b3IgPSBPYmplY3QuY3JlYXRlKHByb3RvR2VuZXJhdG9yLnByb3RvdHlwZSk7XG4gICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dCh0cnlMb2NzTGlzdCB8fCBbXSk7XG5cbiAgICAvLyBUaGUgLl9pbnZva2UgbWV0aG9kIHVuaWZpZXMgdGhlIGltcGxlbWVudGF0aW9ucyBvZiB0aGUgLm5leHQsXG4gICAgLy8gLnRocm93LCBhbmQgLnJldHVybiBtZXRob2RzLlxuICAgIGdlbmVyYXRvci5faW52b2tlID0gbWFrZUludm9rZU1ldGhvZChpbm5lckZuLCBzZWxmLCBjb250ZXh0KTtcblxuICAgIHJldHVybiBnZW5lcmF0b3I7XG4gIH1cbiAgZXhwb3J0cy53cmFwID0gd3JhcDtcblxuICAvLyBUcnkvY2F0Y2ggaGVscGVyIHRvIG1pbmltaXplIGRlb3B0aW1pemF0aW9ucy4gUmV0dXJucyBhIGNvbXBsZXRpb25cbiAgLy8gcmVjb3JkIGxpa2UgY29udGV4dC50cnlFbnRyaWVzW2ldLmNvbXBsZXRpb24uIFRoaXMgaW50ZXJmYWNlIGNvdWxkXG4gIC8vIGhhdmUgYmVlbiAoYW5kIHdhcyBwcmV2aW91c2x5KSBkZXNpZ25lZCB0byB0YWtlIGEgY2xvc3VyZSB0byBiZVxuICAvLyBpbnZva2VkIHdpdGhvdXQgYXJndW1lbnRzLCBidXQgaW4gYWxsIHRoZSBjYXNlcyB3ZSBjYXJlIGFib3V0IHdlXG4gIC8vIGFscmVhZHkgaGF2ZSBhbiBleGlzdGluZyBtZXRob2Qgd2Ugd2FudCB0byBjYWxsLCBzbyB0aGVyZSdzIG5vIG5lZWRcbiAgLy8gdG8gY3JlYXRlIGEgbmV3IGZ1bmN0aW9uIG9iamVjdC4gV2UgY2FuIGV2ZW4gZ2V0IGF3YXkgd2l0aCBhc3N1bWluZ1xuICAvLyB0aGUgbWV0aG9kIHRha2VzIGV4YWN0bHkgb25lIGFyZ3VtZW50LCBzaW5jZSB0aGF0IGhhcHBlbnMgdG8gYmUgdHJ1ZVxuICAvLyBpbiBldmVyeSBjYXNlLCBzbyB3ZSBkb24ndCBoYXZlIHRvIHRvdWNoIHRoZSBhcmd1bWVudHMgb2JqZWN0LiBUaGVcbiAgLy8gb25seSBhZGRpdGlvbmFsIGFsbG9jYXRpb24gcmVxdWlyZWQgaXMgdGhlIGNvbXBsZXRpb24gcmVjb3JkLCB3aGljaFxuICAvLyBoYXMgYSBzdGFibGUgc2hhcGUgYW5kIHNvIGhvcGVmdWxseSBzaG91bGQgYmUgY2hlYXAgdG8gYWxsb2NhdGUuXG4gIGZ1bmN0aW9uIHRyeUNhdGNoKGZuLCBvYmosIGFyZykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBcIm5vcm1hbFwiLCBhcmc6IGZuLmNhbGwob2JqLCBhcmcpIH07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4geyB0eXBlOiBcInRocm93XCIsIGFyZzogZXJyIH07XG4gICAgfVxuICB9XG5cbiAgdmFyIEdlblN0YXRlU3VzcGVuZGVkU3RhcnQgPSBcInN1c3BlbmRlZFN0YXJ0XCI7XG4gIHZhciBHZW5TdGF0ZVN1c3BlbmRlZFlpZWxkID0gXCJzdXNwZW5kZWRZaWVsZFwiO1xuICB2YXIgR2VuU3RhdGVFeGVjdXRpbmcgPSBcImV4ZWN1dGluZ1wiO1xuICB2YXIgR2VuU3RhdGVDb21wbGV0ZWQgPSBcImNvbXBsZXRlZFwiO1xuXG4gIC8vIFJldHVybmluZyB0aGlzIG9iamVjdCBmcm9tIHRoZSBpbm5lckZuIGhhcyB0aGUgc2FtZSBlZmZlY3QgYXNcbiAgLy8gYnJlYWtpbmcgb3V0IG9mIHRoZSBkaXNwYXRjaCBzd2l0Y2ggc3RhdGVtZW50LlxuICB2YXIgQ29udGludWVTZW50aW5lbCA9IHt9O1xuXG4gIC8vIER1bW15IGNvbnN0cnVjdG9yIGZ1bmN0aW9ucyB0aGF0IHdlIHVzZSBhcyB0aGUgLmNvbnN0cnVjdG9yIGFuZFxuICAvLyAuY29uc3RydWN0b3IucHJvdG90eXBlIHByb3BlcnRpZXMgZm9yIGZ1bmN0aW9ucyB0aGF0IHJldHVybiBHZW5lcmF0b3JcbiAgLy8gb2JqZWN0cy4gRm9yIGZ1bGwgc3BlYyBjb21wbGlhbmNlLCB5b3UgbWF5IHdpc2ggdG8gY29uZmlndXJlIHlvdXJcbiAgLy8gbWluaWZpZXIgbm90IHRvIG1hbmdsZSB0aGUgbmFtZXMgb2YgdGhlc2UgdHdvIGZ1bmN0aW9ucy5cbiAgZnVuY3Rpb24gR2VuZXJhdG9yKCkge31cbiAgZnVuY3Rpb24gR2VuZXJhdG9yRnVuY3Rpb24oKSB7fVxuICBmdW5jdGlvbiBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZSgpIHt9XG5cbiAgLy8gVGhpcyBpcyBhIHBvbHlmaWxsIGZvciAlSXRlcmF0b3JQcm90b3R5cGUlIGZvciBlbnZpcm9ubWVudHMgdGhhdFxuICAvLyBkb24ndCBuYXRpdmVseSBzdXBwb3J0IGl0LlxuICB2YXIgSXRlcmF0b3JQcm90b3R5cGUgPSB7fTtcbiAgSXRlcmF0b3JQcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIHZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZjtcbiAgdmFyIE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlID0gZ2V0UHJvdG8gJiYgZ2V0UHJvdG8oZ2V0UHJvdG8odmFsdWVzKFtdKSkpO1xuICBpZiAoTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUgJiZcbiAgICAgIE5hdGl2ZUl0ZXJhdG9yUHJvdG90eXBlICE9PSBPcCAmJlxuICAgICAgaGFzT3duLmNhbGwoTmF0aXZlSXRlcmF0b3JQcm90b3R5cGUsIGl0ZXJhdG9yU3ltYm9sKSkge1xuICAgIC8vIFRoaXMgZW52aXJvbm1lbnQgaGFzIGEgbmF0aXZlICVJdGVyYXRvclByb3RvdHlwZSU7IHVzZSBpdCBpbnN0ZWFkXG4gICAgLy8gb2YgdGhlIHBvbHlmaWxsLlxuICAgIEl0ZXJhdG9yUHJvdG90eXBlID0gTmF0aXZlSXRlcmF0b3JQcm90b3R5cGU7XG4gIH1cblxuICB2YXIgR3AgPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZS5wcm90b3R5cGUgPVxuICAgIEdlbmVyYXRvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEl0ZXJhdG9yUHJvdG90eXBlKTtcbiAgR2VuZXJhdG9yRnVuY3Rpb24ucHJvdG90eXBlID0gR3AuY29uc3RydWN0b3IgPSBHZW5lcmF0b3JGdW5jdGlvblByb3RvdHlwZTtcbiAgR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUuY29uc3RydWN0b3IgPSBHZW5lcmF0b3JGdW5jdGlvbjtcbiAgR2VuZXJhdG9yRnVuY3Rpb24uZGlzcGxheU5hbWUgPSBkZWZpbmUoXG4gICAgR2VuZXJhdG9yRnVuY3Rpb25Qcm90b3R5cGUsXG4gICAgdG9TdHJpbmdUYWdTeW1ib2wsXG4gICAgXCJHZW5lcmF0b3JGdW5jdGlvblwiXG4gICk7XG5cbiAgLy8gSGVscGVyIGZvciBkZWZpbmluZyB0aGUgLm5leHQsIC50aHJvdywgYW5kIC5yZXR1cm4gbWV0aG9kcyBvZiB0aGVcbiAgLy8gSXRlcmF0b3IgaW50ZXJmYWNlIGluIHRlcm1zIG9mIGEgc2luZ2xlIC5faW52b2tlIG1ldGhvZC5cbiAgZnVuY3Rpb24gZGVmaW5lSXRlcmF0b3JNZXRob2RzKHByb3RvdHlwZSkge1xuICAgIFtcIm5leHRcIiwgXCJ0aHJvd1wiLCBcInJldHVyblwiXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgZGVmaW5lKHByb3RvdHlwZSwgbWV0aG9kLCBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludm9rZShtZXRob2QsIGFyZyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGV4cG9ydHMuaXNHZW5lcmF0b3JGdW5jdGlvbiA9IGZ1bmN0aW9uKGdlbkZ1bikge1xuICAgIHZhciBjdG9yID0gdHlwZW9mIGdlbkZ1biA9PT0gXCJmdW5jdGlvblwiICYmIGdlbkZ1bi5jb25zdHJ1Y3RvcjtcbiAgICByZXR1cm4gY3RvclxuICAgICAgPyBjdG9yID09PSBHZW5lcmF0b3JGdW5jdGlvbiB8fFxuICAgICAgICAvLyBGb3IgdGhlIG5hdGl2ZSBHZW5lcmF0b3JGdW5jdGlvbiBjb25zdHJ1Y3RvciwgdGhlIGJlc3Qgd2UgY2FuXG4gICAgICAgIC8vIGRvIGlzIHRvIGNoZWNrIGl0cyAubmFtZSBwcm9wZXJ0eS5cbiAgICAgICAgKGN0b3IuZGlzcGxheU5hbWUgfHwgY3Rvci5uYW1lKSA9PT0gXCJHZW5lcmF0b3JGdW5jdGlvblwiXG4gICAgICA6IGZhbHNlO1xuICB9O1xuXG4gIGV4cG9ydHMubWFyayA9IGZ1bmN0aW9uKGdlbkZ1bikge1xuICAgIGlmIChPYmplY3Quc2V0UHJvdG90eXBlT2YpIHtcbiAgICAgIE9iamVjdC5zZXRQcm90b3R5cGVPZihnZW5GdW4sIEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZ2VuRnVuLl9fcHJvdG9fXyA9IEdlbmVyYXRvckZ1bmN0aW9uUHJvdG90eXBlO1xuICAgICAgZGVmaW5lKGdlbkZ1biwgdG9TdHJpbmdUYWdTeW1ib2wsIFwiR2VuZXJhdG9yRnVuY3Rpb25cIik7XG4gICAgfVxuICAgIGdlbkZ1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEdwKTtcbiAgICByZXR1cm4gZ2VuRnVuO1xuICB9O1xuXG4gIC8vIFdpdGhpbiB0aGUgYm9keSBvZiBhbnkgYXN5bmMgZnVuY3Rpb24sIGBhd2FpdCB4YCBpcyB0cmFuc2Zvcm1lZCB0b1xuICAvLyBgeWllbGQgcmVnZW5lcmF0b3JSdW50aW1lLmF3cmFwKHgpYCwgc28gdGhhdCB0aGUgcnVudGltZSBjYW4gdGVzdFxuICAvLyBgaGFzT3duLmNhbGwodmFsdWUsIFwiX19hd2FpdFwiKWAgdG8gZGV0ZXJtaW5lIGlmIHRoZSB5aWVsZGVkIHZhbHVlIGlzXG4gIC8vIG1lYW50IHRvIGJlIGF3YWl0ZWQuXG4gIGV4cG9ydHMuYXdyYXAgPSBmdW5jdGlvbihhcmcpIHtcbiAgICByZXR1cm4geyBfX2F3YWl0OiBhcmcgfTtcbiAgfTtcblxuICBmdW5jdGlvbiBBc3luY0l0ZXJhdG9yKGdlbmVyYXRvciwgUHJvbWlzZUltcGwpIHtcbiAgICBmdW5jdGlvbiBpbnZva2UobWV0aG9kLCBhcmcsIHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHJlY29yZCA9IHRyeUNhdGNoKGdlbmVyYXRvclttZXRob2RdLCBnZW5lcmF0b3IsIGFyZyk7XG4gICAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICByZWplY3QocmVjb3JkLmFyZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgcmVzdWx0ID0gcmVjb3JkLmFyZztcbiAgICAgICAgdmFyIHZhbHVlID0gcmVzdWx0LnZhbHVlO1xuICAgICAgICBpZiAodmFsdWUgJiZcbiAgICAgICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgaGFzT3duLmNhbGwodmFsdWUsIFwiX19hd2FpdFwiKSkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlSW1wbC5yZXNvbHZlKHZhbHVlLl9fYXdhaXQpLnRoZW4oZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGludm9rZShcIm5leHRcIiwgdmFsdWUsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBpbnZva2UoXCJ0aHJvd1wiLCBlcnIsIHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUHJvbWlzZUltcGwucmVzb2x2ZSh2YWx1ZSkudGhlbihmdW5jdGlvbih1bndyYXBwZWQpIHtcbiAgICAgICAgICAvLyBXaGVuIGEgeWllbGRlZCBQcm9taXNlIGlzIHJlc29sdmVkLCBpdHMgZmluYWwgdmFsdWUgYmVjb21lc1xuICAgICAgICAgIC8vIHRoZSAudmFsdWUgb2YgdGhlIFByb21pc2U8e3ZhbHVlLGRvbmV9PiByZXN1bHQgZm9yIHRoZVxuICAgICAgICAgIC8vIGN1cnJlbnQgaXRlcmF0aW9uLlxuICAgICAgICAgIHJlc3VsdC52YWx1ZSA9IHVud3JhcHBlZDtcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgICAgLy8gSWYgYSByZWplY3RlZCBQcm9taXNlIHdhcyB5aWVsZGVkLCB0aHJvdyB0aGUgcmVqZWN0aW9uIGJhY2tcbiAgICAgICAgICAvLyBpbnRvIHRoZSBhc3luYyBnZW5lcmF0b3IgZnVuY3Rpb24gc28gaXQgY2FuIGJlIGhhbmRsZWQgdGhlcmUuXG4gICAgICAgICAgcmV0dXJuIGludm9rZShcInRocm93XCIsIGVycm9yLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcHJldmlvdXNQcm9taXNlO1xuXG4gICAgZnVuY3Rpb24gZW5xdWV1ZShtZXRob2QsIGFyZykge1xuICAgICAgZnVuY3Rpb24gY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZUltcGwoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgaW52b2tlKG1ldGhvZCwgYXJnLCByZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByZXZpb3VzUHJvbWlzZSA9XG4gICAgICAgIC8vIElmIGVucXVldWUgaGFzIGJlZW4gY2FsbGVkIGJlZm9yZSwgdGhlbiB3ZSB3YW50IHRvIHdhaXQgdW50aWxcbiAgICAgICAgLy8gYWxsIHByZXZpb3VzIFByb21pc2VzIGhhdmUgYmVlbiByZXNvbHZlZCBiZWZvcmUgY2FsbGluZyBpbnZva2UsXG4gICAgICAgIC8vIHNvIHRoYXQgcmVzdWx0cyBhcmUgYWx3YXlzIGRlbGl2ZXJlZCBpbiB0aGUgY29ycmVjdCBvcmRlci4gSWZcbiAgICAgICAgLy8gZW5xdWV1ZSBoYXMgbm90IGJlZW4gY2FsbGVkIGJlZm9yZSwgdGhlbiBpdCBpcyBpbXBvcnRhbnQgdG9cbiAgICAgICAgLy8gY2FsbCBpbnZva2UgaW1tZWRpYXRlbHksIHdpdGhvdXQgd2FpdGluZyBvbiBhIGNhbGxiYWNrIHRvIGZpcmUsXG4gICAgICAgIC8vIHNvIHRoYXQgdGhlIGFzeW5jIGdlbmVyYXRvciBmdW5jdGlvbiBoYXMgdGhlIG9wcG9ydHVuaXR5IHRvIGRvXG4gICAgICAgIC8vIGFueSBuZWNlc3Nhcnkgc2V0dXAgaW4gYSBwcmVkaWN0YWJsZSB3YXkuIFRoaXMgcHJlZGljdGFiaWxpdHlcbiAgICAgICAgLy8gaXMgd2h5IHRoZSBQcm9taXNlIGNvbnN0cnVjdG9yIHN5bmNocm9ub3VzbHkgaW52b2tlcyBpdHNcbiAgICAgICAgLy8gZXhlY3V0b3IgY2FsbGJhY2ssIGFuZCB3aHkgYXN5bmMgZnVuY3Rpb25zIHN5bmNocm9ub3VzbHlcbiAgICAgICAgLy8gZXhlY3V0ZSBjb2RlIGJlZm9yZSB0aGUgZmlyc3QgYXdhaXQuIFNpbmNlIHdlIGltcGxlbWVudCBzaW1wbGVcbiAgICAgICAgLy8gYXN5bmMgZnVuY3Rpb25zIGluIHRlcm1zIG9mIGFzeW5jIGdlbmVyYXRvcnMsIGl0IGlzIGVzcGVjaWFsbHlcbiAgICAgICAgLy8gaW1wb3J0YW50IHRvIGdldCB0aGlzIHJpZ2h0LCBldmVuIHRob3VnaCBpdCByZXF1aXJlcyBjYXJlLlxuICAgICAgICBwcmV2aW91c1Byb21pc2UgPyBwcmV2aW91c1Byb21pc2UudGhlbihcbiAgICAgICAgICBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZyxcbiAgICAgICAgICAvLyBBdm9pZCBwcm9wYWdhdGluZyBmYWlsdXJlcyB0byBQcm9taXNlcyByZXR1cm5lZCBieSBsYXRlclxuICAgICAgICAgIC8vIGludm9jYXRpb25zIG9mIHRoZSBpdGVyYXRvci5cbiAgICAgICAgICBjYWxsSW52b2tlV2l0aE1ldGhvZEFuZEFyZ1xuICAgICAgICApIDogY2FsbEludm9rZVdpdGhNZXRob2RBbmRBcmcoKTtcbiAgICB9XG5cbiAgICAvLyBEZWZpbmUgdGhlIHVuaWZpZWQgaGVscGVyIG1ldGhvZCB0aGF0IGlzIHVzZWQgdG8gaW1wbGVtZW50IC5uZXh0LFxuICAgIC8vIC50aHJvdywgYW5kIC5yZXR1cm4gKHNlZSBkZWZpbmVJdGVyYXRvck1ldGhvZHMpLlxuICAgIHRoaXMuX2ludm9rZSA9IGVucXVldWU7XG4gIH1cblxuICBkZWZpbmVJdGVyYXRvck1ldGhvZHMoQXN5bmNJdGVyYXRvci5wcm90b3R5cGUpO1xuICBBc3luY0l0ZXJhdG9yLnByb3RvdHlwZVthc3luY0l0ZXJhdG9yU3ltYm9sXSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcbiAgZXhwb3J0cy5Bc3luY0l0ZXJhdG9yID0gQXN5bmNJdGVyYXRvcjtcblxuICAvLyBOb3RlIHRoYXQgc2ltcGxlIGFzeW5jIGZ1bmN0aW9ucyBhcmUgaW1wbGVtZW50ZWQgb24gdG9wIG9mXG4gIC8vIEFzeW5jSXRlcmF0b3Igb2JqZWN0czsgdGhleSBqdXN0IHJldHVybiBhIFByb21pc2UgZm9yIHRoZSB2YWx1ZSBvZlxuICAvLyB0aGUgZmluYWwgcmVzdWx0IHByb2R1Y2VkIGJ5IHRoZSBpdGVyYXRvci5cbiAgZXhwb3J0cy5hc3luYyA9IGZ1bmN0aW9uKGlubmVyRm4sIG91dGVyRm4sIHNlbGYsIHRyeUxvY3NMaXN0LCBQcm9taXNlSW1wbCkge1xuICAgIGlmIChQcm9taXNlSW1wbCA9PT0gdm9pZCAwKSBQcm9taXNlSW1wbCA9IFByb21pc2U7XG5cbiAgICB2YXIgaXRlciA9IG5ldyBBc3luY0l0ZXJhdG9yKFxuICAgICAgd3JhcChpbm5lckZuLCBvdXRlckZuLCBzZWxmLCB0cnlMb2NzTGlzdCksXG4gICAgICBQcm9taXNlSW1wbFxuICAgICk7XG5cbiAgICByZXR1cm4gZXhwb3J0cy5pc0dlbmVyYXRvckZ1bmN0aW9uKG91dGVyRm4pXG4gICAgICA/IGl0ZXIgLy8gSWYgb3V0ZXJGbiBpcyBhIGdlbmVyYXRvciwgcmV0dXJuIHRoZSBmdWxsIGl0ZXJhdG9yLlxuICAgICAgOiBpdGVyLm5leHQoKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgIHJldHVybiByZXN1bHQuZG9uZSA/IHJlc3VsdC52YWx1ZSA6IGl0ZXIubmV4dCgpO1xuICAgICAgICB9KTtcbiAgfTtcblxuICBmdW5jdGlvbiBtYWtlSW52b2tlTWV0aG9kKGlubmVyRm4sIHNlbGYsIGNvbnRleHQpIHtcbiAgICB2YXIgc3RhdGUgPSBHZW5TdGF0ZVN1c3BlbmRlZFN0YXJ0O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGludm9rZShtZXRob2QsIGFyZykge1xuICAgICAgaWYgKHN0YXRlID09PSBHZW5TdGF0ZUV4ZWN1dGluZykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBydW5uaW5nXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlQ29tcGxldGVkKSB7XG4gICAgICAgIGlmIChtZXRob2QgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIHRocm93IGFyZztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJlIGZvcmdpdmluZywgcGVyIDI1LjMuMy4zLjMgb2YgdGhlIHNwZWM6XG4gICAgICAgIC8vIGh0dHBzOi8vcGVvcGxlLm1vemlsbGEub3JnL35qb3JlbmRvcmZmL2VzNi1kcmFmdC5odG1sI3NlYy1nZW5lcmF0b3JyZXN1bWVcbiAgICAgICAgcmV0dXJuIGRvbmVSZXN1bHQoKTtcbiAgICAgIH1cblxuICAgICAgY29udGV4dC5tZXRob2QgPSBtZXRob2Q7XG4gICAgICBjb250ZXh0LmFyZyA9IGFyZztcblxuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdmFyIGRlbGVnYXRlID0gY29udGV4dC5kZWxlZ2F0ZTtcbiAgICAgICAgaWYgKGRlbGVnYXRlKSB7XG4gICAgICAgICAgdmFyIGRlbGVnYXRlUmVzdWx0ID0gbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCk7XG4gICAgICAgICAgaWYgKGRlbGVnYXRlUmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoZGVsZWdhdGVSZXN1bHQgPT09IENvbnRpbnVlU2VudGluZWwpIGNvbnRpbnVlO1xuICAgICAgICAgICAgcmV0dXJuIGRlbGVnYXRlUmVzdWx0O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb250ZXh0Lm1ldGhvZCA9PT0gXCJuZXh0XCIpIHtcbiAgICAgICAgICAvLyBTZXR0aW5nIGNvbnRleHQuX3NlbnQgZm9yIGxlZ2FjeSBzdXBwb3J0IG9mIEJhYmVsJ3NcbiAgICAgICAgICAvLyBmdW5jdGlvbi5zZW50IGltcGxlbWVudGF0aW9uLlxuICAgICAgICAgIGNvbnRleHQuc2VudCA9IGNvbnRleHQuX3NlbnQgPSBjb250ZXh0LmFyZztcblxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQubWV0aG9kID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICBpZiAoc3RhdGUgPT09IEdlblN0YXRlU3VzcGVuZGVkU3RhcnQpIHtcbiAgICAgICAgICAgIHN0YXRlID0gR2VuU3RhdGVDb21wbGV0ZWQ7XG4gICAgICAgICAgICB0aHJvdyBjb250ZXh0LmFyZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb250ZXh0LmRpc3BhdGNoRXhjZXB0aW9uKGNvbnRleHQuYXJnKTtcblxuICAgICAgICB9IGVsc2UgaWYgKGNvbnRleHQubWV0aG9kID09PSBcInJldHVyblwiKSB7XG4gICAgICAgICAgY29udGV4dC5hYnJ1cHQoXCJyZXR1cm5cIiwgY29udGV4dC5hcmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUgPSBHZW5TdGF0ZUV4ZWN1dGluZztcblxuICAgICAgICB2YXIgcmVjb3JkID0gdHJ5Q2F0Y2goaW5uZXJGbiwgc2VsZiwgY29udGV4dCk7XG4gICAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJub3JtYWxcIikge1xuICAgICAgICAgIC8vIElmIGFuIGV4Y2VwdGlvbiBpcyB0aHJvd24gZnJvbSBpbm5lckZuLCB3ZSBsZWF2ZSBzdGF0ZSA9PT1cbiAgICAgICAgICAvLyBHZW5TdGF0ZUV4ZWN1dGluZyBhbmQgbG9vcCBiYWNrIGZvciBhbm90aGVyIGludm9jYXRpb24uXG4gICAgICAgICAgc3RhdGUgPSBjb250ZXh0LmRvbmVcbiAgICAgICAgICAgID8gR2VuU3RhdGVDb21wbGV0ZWRcbiAgICAgICAgICAgIDogR2VuU3RhdGVTdXNwZW5kZWRZaWVsZDtcblxuICAgICAgICAgIGlmIChyZWNvcmQuYXJnID09PSBDb250aW51ZVNlbnRpbmVsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdmFsdWU6IHJlY29yZC5hcmcsXG4gICAgICAgICAgICBkb25lOiBjb250ZXh0LmRvbmVcbiAgICAgICAgICB9O1xuXG4gICAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgIHN0YXRlID0gR2VuU3RhdGVDb21wbGV0ZWQ7XG4gICAgICAgICAgLy8gRGlzcGF0Y2ggdGhlIGV4Y2VwdGlvbiBieSBsb29waW5nIGJhY2sgYXJvdW5kIHRvIHRoZVxuICAgICAgICAgIC8vIGNvbnRleHQuZGlzcGF0Y2hFeGNlcHRpb24oY29udGV4dC5hcmcpIGNhbGwgYWJvdmUuXG4gICAgICAgICAgY29udGV4dC5tZXRob2QgPSBcInRocm93XCI7XG4gICAgICAgICAgY29udGV4dC5hcmcgPSByZWNvcmQuYXJnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8vIENhbGwgZGVsZWdhdGUuaXRlcmF0b3JbY29udGV4dC5tZXRob2RdKGNvbnRleHQuYXJnKSBhbmQgaGFuZGxlIHRoZVxuICAvLyByZXN1bHQsIGVpdGhlciBieSByZXR1cm5pbmcgYSB7IHZhbHVlLCBkb25lIH0gcmVzdWx0IGZyb20gdGhlXG4gIC8vIGRlbGVnYXRlIGl0ZXJhdG9yLCBvciBieSBtb2RpZnlpbmcgY29udGV4dC5tZXRob2QgYW5kIGNvbnRleHQuYXJnLFxuICAvLyBzZXR0aW5nIGNvbnRleHQuZGVsZWdhdGUgdG8gbnVsbCwgYW5kIHJldHVybmluZyB0aGUgQ29udGludWVTZW50aW5lbC5cbiAgZnVuY3Rpb24gbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCkge1xuICAgIHZhciBtZXRob2QgPSBkZWxlZ2F0ZS5pdGVyYXRvcltjb250ZXh0Lm1ldGhvZF07XG4gICAgaWYgKG1ldGhvZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBBIC50aHJvdyBvciAucmV0dXJuIHdoZW4gdGhlIGRlbGVnYXRlIGl0ZXJhdG9yIGhhcyBubyAudGhyb3dcbiAgICAgIC8vIG1ldGhvZCBhbHdheXMgdGVybWluYXRlcyB0aGUgeWllbGQqIGxvb3AuXG4gICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcblxuICAgICAgaWYgKGNvbnRleHQubWV0aG9kID09PSBcInRocm93XCIpIHtcbiAgICAgICAgLy8gTm90ZTogW1wicmV0dXJuXCJdIG11c3QgYmUgdXNlZCBmb3IgRVMzIHBhcnNpbmcgY29tcGF0aWJpbGl0eS5cbiAgICAgICAgaWYgKGRlbGVnYXRlLml0ZXJhdG9yW1wicmV0dXJuXCJdKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGRlbGVnYXRlIGl0ZXJhdG9yIGhhcyBhIHJldHVybiBtZXRob2QsIGdpdmUgaXQgYVxuICAgICAgICAgIC8vIGNoYW5jZSB0byBjbGVhbiB1cC5cbiAgICAgICAgICBjb250ZXh0Lm1ldGhvZCA9IFwicmV0dXJuXCI7XG4gICAgICAgICAgY29udGV4dC5hcmcgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgbWF5YmVJbnZva2VEZWxlZ2F0ZShkZWxlZ2F0ZSwgY29udGV4dCk7XG5cbiAgICAgICAgICBpZiAoY29udGV4dC5tZXRob2QgPT09IFwidGhyb3dcIikge1xuICAgICAgICAgICAgLy8gSWYgbWF5YmVJbnZva2VEZWxlZ2F0ZShjb250ZXh0KSBjaGFuZ2VkIGNvbnRleHQubWV0aG9kIGZyb21cbiAgICAgICAgICAgIC8vIFwicmV0dXJuXCIgdG8gXCJ0aHJvd1wiLCBsZXQgdGhhdCBvdmVycmlkZSB0aGUgVHlwZUVycm9yIGJlbG93LlxuICAgICAgICAgICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29udGV4dC5tZXRob2QgPSBcInRocm93XCI7XG4gICAgICAgIGNvbnRleHQuYXJnID0gbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICBcIlRoZSBpdGVyYXRvciBkb2VzIG5vdCBwcm92aWRlIGEgJ3Rocm93JyBtZXRob2RcIik7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cblxuICAgIHZhciByZWNvcmQgPSB0cnlDYXRjaChtZXRob2QsIGRlbGVnYXRlLml0ZXJhdG9yLCBjb250ZXh0LmFyZyk7XG5cbiAgICBpZiAocmVjb3JkLnR5cGUgPT09IFwidGhyb3dcIikge1xuICAgICAgY29udGV4dC5tZXRob2QgPSBcInRocm93XCI7XG4gICAgICBjb250ZXh0LmFyZyA9IHJlY29yZC5hcmc7XG4gICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cblxuICAgIHZhciBpbmZvID0gcmVjb3JkLmFyZztcblxuICAgIGlmICghIGluZm8pIHtcbiAgICAgIGNvbnRleHQubWV0aG9kID0gXCJ0aHJvd1wiO1xuICAgICAgY29udGV4dC5hcmcgPSBuZXcgVHlwZUVycm9yKFwiaXRlcmF0b3IgcmVzdWx0IGlzIG5vdCBhbiBvYmplY3RcIik7XG4gICAgICBjb250ZXh0LmRlbGVnYXRlID0gbnVsbDtcbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH1cblxuICAgIGlmIChpbmZvLmRvbmUpIHtcbiAgICAgIC8vIEFzc2lnbiB0aGUgcmVzdWx0IG9mIHRoZSBmaW5pc2hlZCBkZWxlZ2F0ZSB0byB0aGUgdGVtcG9yYXJ5XG4gICAgICAvLyB2YXJpYWJsZSBzcGVjaWZpZWQgYnkgZGVsZWdhdGUucmVzdWx0TmFtZSAoc2VlIGRlbGVnYXRlWWllbGQpLlxuICAgICAgY29udGV4dFtkZWxlZ2F0ZS5yZXN1bHROYW1lXSA9IGluZm8udmFsdWU7XG5cbiAgICAgIC8vIFJlc3VtZSBleGVjdXRpb24gYXQgdGhlIGRlc2lyZWQgbG9jYXRpb24gKHNlZSBkZWxlZ2F0ZVlpZWxkKS5cbiAgICAgIGNvbnRleHQubmV4dCA9IGRlbGVnYXRlLm5leHRMb2M7XG5cbiAgICAgIC8vIElmIGNvbnRleHQubWV0aG9kIHdhcyBcInRocm93XCIgYnV0IHRoZSBkZWxlZ2F0ZSBoYW5kbGVkIHRoZVxuICAgICAgLy8gZXhjZXB0aW9uLCBsZXQgdGhlIG91dGVyIGdlbmVyYXRvciBwcm9jZWVkIG5vcm1hbGx5LiBJZlxuICAgICAgLy8gY29udGV4dC5tZXRob2Qgd2FzIFwibmV4dFwiLCBmb3JnZXQgY29udGV4dC5hcmcgc2luY2UgaXQgaGFzIGJlZW5cbiAgICAgIC8vIFwiY29uc3VtZWRcIiBieSB0aGUgZGVsZWdhdGUgaXRlcmF0b3IuIElmIGNvbnRleHQubWV0aG9kIHdhc1xuICAgICAgLy8gXCJyZXR1cm5cIiwgYWxsb3cgdGhlIG9yaWdpbmFsIC5yZXR1cm4gY2FsbCB0byBjb250aW51ZSBpbiB0aGVcbiAgICAgIC8vIG91dGVyIGdlbmVyYXRvci5cbiAgICAgIGlmIChjb250ZXh0Lm1ldGhvZCAhPT0gXCJyZXR1cm5cIikge1xuICAgICAgICBjb250ZXh0Lm1ldGhvZCA9IFwibmV4dFwiO1xuICAgICAgICBjb250ZXh0LmFyZyA9IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZS15aWVsZCB0aGUgcmVzdWx0IHJldHVybmVkIGJ5IHRoZSBkZWxlZ2F0ZSBtZXRob2QuXG4gICAgICByZXR1cm4gaW5mbztcbiAgICB9XG5cbiAgICAvLyBUaGUgZGVsZWdhdGUgaXRlcmF0b3IgaXMgZmluaXNoZWQsIHNvIGZvcmdldCBpdCBhbmQgY29udGludWUgd2l0aFxuICAgIC8vIHRoZSBvdXRlciBnZW5lcmF0b3IuXG4gICAgY29udGV4dC5kZWxlZ2F0ZSA9IG51bGw7XG4gICAgcmV0dXJuIENvbnRpbnVlU2VudGluZWw7XG4gIH1cblxuICAvLyBEZWZpbmUgR2VuZXJhdG9yLnByb3RvdHlwZS57bmV4dCx0aHJvdyxyZXR1cm59IGluIHRlcm1zIG9mIHRoZVxuICAvLyB1bmlmaWVkIC5faW52b2tlIGhlbHBlciBtZXRob2QuXG4gIGRlZmluZUl0ZXJhdG9yTWV0aG9kcyhHcCk7XG5cbiAgZGVmaW5lKEdwLCB0b1N0cmluZ1RhZ1N5bWJvbCwgXCJHZW5lcmF0b3JcIik7XG5cbiAgLy8gQSBHZW5lcmF0b3Igc2hvdWxkIGFsd2F5cyByZXR1cm4gaXRzZWxmIGFzIHRoZSBpdGVyYXRvciBvYmplY3Qgd2hlbiB0aGVcbiAgLy8gQEBpdGVyYXRvciBmdW5jdGlvbiBpcyBjYWxsZWQgb24gaXQuIFNvbWUgYnJvd3NlcnMnIGltcGxlbWVudGF0aW9ucyBvZiB0aGVcbiAgLy8gaXRlcmF0b3IgcHJvdG90eXBlIGNoYWluIGluY29ycmVjdGx5IGltcGxlbWVudCB0aGlzLCBjYXVzaW5nIHRoZSBHZW5lcmF0b3JcbiAgLy8gb2JqZWN0IHRvIG5vdCBiZSByZXR1cm5lZCBmcm9tIHRoaXMgY2FsbC4gVGhpcyBlbnN1cmVzIHRoYXQgZG9lc24ndCBoYXBwZW4uXG4gIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZmFjZWJvb2svcmVnZW5lcmF0b3IvaXNzdWVzLzI3NCBmb3IgbW9yZSBkZXRhaWxzLlxuICBHcFtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBHcC50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgR2VuZXJhdG9yXVwiO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHB1c2hUcnlFbnRyeShsb2NzKSB7XG4gICAgdmFyIGVudHJ5ID0geyB0cnlMb2M6IGxvY3NbMF0gfTtcblxuICAgIGlmICgxIGluIGxvY3MpIHtcbiAgICAgIGVudHJ5LmNhdGNoTG9jID0gbG9jc1sxXTtcbiAgICB9XG5cbiAgICBpZiAoMiBpbiBsb2NzKSB7XG4gICAgICBlbnRyeS5maW5hbGx5TG9jID0gbG9jc1syXTtcbiAgICAgIGVudHJ5LmFmdGVyTG9jID0gbG9jc1szXTtcbiAgICB9XG5cbiAgICB0aGlzLnRyeUVudHJpZXMucHVzaChlbnRyeSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNldFRyeUVudHJ5KGVudHJ5KSB7XG4gICAgdmFyIHJlY29yZCA9IGVudHJ5LmNvbXBsZXRpb24gfHwge307XG4gICAgcmVjb3JkLnR5cGUgPSBcIm5vcm1hbFwiO1xuICAgIGRlbGV0ZSByZWNvcmQuYXJnO1xuICAgIGVudHJ5LmNvbXBsZXRpb24gPSByZWNvcmQ7XG4gIH1cblxuICBmdW5jdGlvbiBDb250ZXh0KHRyeUxvY3NMaXN0KSB7XG4gICAgLy8gVGhlIHJvb3QgZW50cnkgb2JqZWN0IChlZmZlY3RpdmVseSBhIHRyeSBzdGF0ZW1lbnQgd2l0aG91dCBhIGNhdGNoXG4gICAgLy8gb3IgYSBmaW5hbGx5IGJsb2NrKSBnaXZlcyB1cyBhIHBsYWNlIHRvIHN0b3JlIHZhbHVlcyB0aHJvd24gZnJvbVxuICAgIC8vIGxvY2F0aW9ucyB3aGVyZSB0aGVyZSBpcyBubyBlbmNsb3NpbmcgdHJ5IHN0YXRlbWVudC5cbiAgICB0aGlzLnRyeUVudHJpZXMgPSBbeyB0cnlMb2M6IFwicm9vdFwiIH1dO1xuICAgIHRyeUxvY3NMaXN0LmZvckVhY2gocHVzaFRyeUVudHJ5LCB0aGlzKTtcbiAgICB0aGlzLnJlc2V0KHRydWUpO1xuICB9XG5cbiAgZXhwb3J0cy5rZXlzID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICB9XG4gICAga2V5cy5yZXZlcnNlKCk7XG5cbiAgICAvLyBSYXRoZXIgdGhhbiByZXR1cm5pbmcgYW4gb2JqZWN0IHdpdGggYSBuZXh0IG1ldGhvZCwgd2Uga2VlcFxuICAgIC8vIHRoaW5ncyBzaW1wbGUgYW5kIHJldHVybiB0aGUgbmV4dCBmdW5jdGlvbiBpdHNlbGYuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICB3aGlsZSAoa2V5cy5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGtleSA9IGtleXMucG9wKCk7XG4gICAgICAgIGlmIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgbmV4dC52YWx1ZSA9IGtleTtcbiAgICAgICAgICBuZXh0LmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUbyBhdm9pZCBjcmVhdGluZyBhbiBhZGRpdGlvbmFsIG9iamVjdCwgd2UganVzdCBoYW5nIHRoZSAudmFsdWVcbiAgICAgIC8vIGFuZCAuZG9uZSBwcm9wZXJ0aWVzIG9mZiB0aGUgbmV4dCBmdW5jdGlvbiBvYmplY3QgaXRzZWxmLiBUaGlzXG4gICAgICAvLyBhbHNvIGVuc3VyZXMgdGhhdCB0aGUgbWluaWZpZXIgd2lsbCBub3QgYW5vbnltaXplIHRoZSBmdW5jdGlvbi5cbiAgICAgIG5leHQuZG9uZSA9IHRydWU7XG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9O1xuICB9O1xuXG4gIGZ1bmN0aW9uIHZhbHVlcyhpdGVyYWJsZSkge1xuICAgIGlmIChpdGVyYWJsZSkge1xuICAgICAgdmFyIGl0ZXJhdG9yTWV0aG9kID0gaXRlcmFibGVbaXRlcmF0b3JTeW1ib2xdO1xuICAgICAgaWYgKGl0ZXJhdG9yTWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBpdGVyYXRvck1ldGhvZC5jYWxsKGl0ZXJhYmxlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBpdGVyYWJsZS5uZXh0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhYmxlO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzTmFOKGl0ZXJhYmxlLmxlbmd0aCkpIHtcbiAgICAgICAgdmFyIGkgPSAtMSwgbmV4dCA9IGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgd2hpbGUgKCsraSA8IGl0ZXJhYmxlLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKGl0ZXJhYmxlLCBpKSkge1xuICAgICAgICAgICAgICBuZXh0LnZhbHVlID0gaXRlcmFibGVbaV07XG4gICAgICAgICAgICAgIG5leHQuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBuZXh0LnZhbHVlID0gdW5kZWZpbmVkO1xuICAgICAgICAgIG5leHQuZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICByZXR1cm4gbmV4dDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gbmV4dC5uZXh0ID0gbmV4dDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gYW4gaXRlcmF0b3Igd2l0aCBubyB2YWx1ZXMuXG4gICAgcmV0dXJuIHsgbmV4dDogZG9uZVJlc3VsdCB9O1xuICB9XG4gIGV4cG9ydHMudmFsdWVzID0gdmFsdWVzO1xuXG4gIGZ1bmN0aW9uIGRvbmVSZXN1bHQoKSB7XG4gICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICB9XG5cbiAgQ29udGV4dC5wcm90b3R5cGUgPSB7XG4gICAgY29uc3RydWN0b3I6IENvbnRleHQsXG5cbiAgICByZXNldDogZnVuY3Rpb24oc2tpcFRlbXBSZXNldCkge1xuICAgICAgdGhpcy5wcmV2ID0gMDtcbiAgICAgIHRoaXMubmV4dCA9IDA7XG4gICAgICAvLyBSZXNldHRpbmcgY29udGV4dC5fc2VudCBmb3IgbGVnYWN5IHN1cHBvcnQgb2YgQmFiZWwnc1xuICAgICAgLy8gZnVuY3Rpb24uc2VudCBpbXBsZW1lbnRhdGlvbi5cbiAgICAgIHRoaXMuc2VudCA9IHRoaXMuX3NlbnQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmRvbmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuZGVsZWdhdGUgPSBudWxsO1xuXG4gICAgICB0aGlzLm1ldGhvZCA9IFwibmV4dFwiO1xuICAgICAgdGhpcy5hcmcgPSB1bmRlZmluZWQ7XG5cbiAgICAgIHRoaXMudHJ5RW50cmllcy5mb3JFYWNoKHJlc2V0VHJ5RW50cnkpO1xuXG4gICAgICBpZiAoIXNraXBUZW1wUmVzZXQpIHtcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzKSB7XG4gICAgICAgICAgLy8gTm90IHN1cmUgYWJvdXQgdGhlIG9wdGltYWwgb3JkZXIgb2YgdGhlc2UgY29uZGl0aW9uczpcbiAgICAgICAgICBpZiAobmFtZS5jaGFyQXQoMCkgPT09IFwidFwiICYmXG4gICAgICAgICAgICAgIGhhc093bi5jYWxsKHRoaXMsIG5hbWUpICYmXG4gICAgICAgICAgICAgICFpc05hTigrbmFtZS5zbGljZSgxKSkpIHtcbiAgICAgICAgICAgIHRoaXNbbmFtZV0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5kb25lID0gdHJ1ZTtcblxuICAgICAgdmFyIHJvb3RFbnRyeSA9IHRoaXMudHJ5RW50cmllc1swXTtcbiAgICAgIHZhciByb290UmVjb3JkID0gcm9vdEVudHJ5LmNvbXBsZXRpb247XG4gICAgICBpZiAocm9vdFJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgdGhyb3cgcm9vdFJlY29yZC5hcmc7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLnJ2YWw7XG4gICAgfSxcblxuICAgIGRpc3BhdGNoRXhjZXB0aW9uOiBmdW5jdGlvbihleGNlcHRpb24pIHtcbiAgICAgIGlmICh0aGlzLmRvbmUpIHtcbiAgICAgICAgdGhyb3cgZXhjZXB0aW9uO1xuICAgICAgfVxuXG4gICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG4gICAgICBmdW5jdGlvbiBoYW5kbGUobG9jLCBjYXVnaHQpIHtcbiAgICAgICAgcmVjb3JkLnR5cGUgPSBcInRocm93XCI7XG4gICAgICAgIHJlY29yZC5hcmcgPSBleGNlcHRpb247XG4gICAgICAgIGNvbnRleHQubmV4dCA9IGxvYztcblxuICAgICAgICBpZiAoY2F1Z2h0KSB7XG4gICAgICAgICAgLy8gSWYgdGhlIGRpc3BhdGNoZWQgZXhjZXB0aW9uIHdhcyBjYXVnaHQgYnkgYSBjYXRjaCBibG9jayxcbiAgICAgICAgICAvLyB0aGVuIGxldCB0aGF0IGNhdGNoIGJsb2NrIGhhbmRsZSB0aGUgZXhjZXB0aW9uIG5vcm1hbGx5LlxuICAgICAgICAgIGNvbnRleHQubWV0aG9kID0gXCJuZXh0XCI7XG4gICAgICAgICAgY29udGV4dC5hcmcgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gISEgY2F1Z2h0O1xuICAgICAgfVxuXG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTtcbiAgICAgICAgdmFyIHJlY29yZCA9IGVudHJ5LmNvbXBsZXRpb247XG5cbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA9PT0gXCJyb290XCIpIHtcbiAgICAgICAgICAvLyBFeGNlcHRpb24gdGhyb3duIG91dHNpZGUgb2YgYW55IHRyeSBibG9jayB0aGF0IGNvdWxkIGhhbmRsZVxuICAgICAgICAgIC8vIGl0LCBzbyBzZXQgdGhlIGNvbXBsZXRpb24gdmFsdWUgb2YgdGhlIGVudGlyZSBmdW5jdGlvbiB0b1xuICAgICAgICAgIC8vIHRocm93IHRoZSBleGNlcHRpb24uXG4gICAgICAgICAgcmV0dXJuIGhhbmRsZShcImVuZFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlbnRyeS50cnlMb2MgPD0gdGhpcy5wcmV2KSB7XG4gICAgICAgICAgdmFyIGhhc0NhdGNoID0gaGFzT3duLmNhbGwoZW50cnksIFwiY2F0Y2hMb2NcIik7XG4gICAgICAgICAgdmFyIGhhc0ZpbmFsbHkgPSBoYXNPd24uY2FsbChlbnRyeSwgXCJmaW5hbGx5TG9jXCIpO1xuXG4gICAgICAgICAgaWYgKGhhc0NhdGNoICYmIGhhc0ZpbmFsbHkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByZXYgPCBlbnRyeS5jYXRjaExvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmNhdGNoTG9jLCB0cnVlKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5wcmV2IDwgZW50cnkuZmluYWxseUxvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmZpbmFsbHlMb2MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfSBlbHNlIGlmIChoYXNDYXRjaCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJldiA8IGVudHJ5LmNhdGNoTG9jKSB7XG4gICAgICAgICAgICAgIHJldHVybiBoYW5kbGUoZW50cnkuY2F0Y2hMb2MsIHRydWUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfSBlbHNlIGlmIChoYXNGaW5hbGx5KSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmV2IDwgZW50cnkuZmluYWxseUxvYykge1xuICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlKGVudHJ5LmZpbmFsbHlMb2MpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInRyeSBzdGF0ZW1lbnQgd2l0aG91dCBjYXRjaCBvciBmaW5hbGx5XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBhYnJ1cHQ6IGZ1bmN0aW9uKHR5cGUsIGFyZykge1xuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudHJ5RW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgZW50cnkgPSB0aGlzLnRyeUVudHJpZXNbaV07XG4gICAgICAgIGlmIChlbnRyeS50cnlMb2MgPD0gdGhpcy5wcmV2ICYmXG4gICAgICAgICAgICBoYXNPd24uY2FsbChlbnRyeSwgXCJmaW5hbGx5TG9jXCIpICYmXG4gICAgICAgICAgICB0aGlzLnByZXYgPCBlbnRyeS5maW5hbGx5TG9jKSB7XG4gICAgICAgICAgdmFyIGZpbmFsbHlFbnRyeSA9IGVudHJ5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmaW5hbGx5RW50cnkgJiZcbiAgICAgICAgICAodHlwZSA9PT0gXCJicmVha1wiIHx8XG4gICAgICAgICAgIHR5cGUgPT09IFwiY29udGludWVcIikgJiZcbiAgICAgICAgICBmaW5hbGx5RW50cnkudHJ5TG9jIDw9IGFyZyAmJlxuICAgICAgICAgIGFyZyA8PSBmaW5hbGx5RW50cnkuZmluYWxseUxvYykge1xuICAgICAgICAvLyBJZ25vcmUgdGhlIGZpbmFsbHkgZW50cnkgaWYgY29udHJvbCBpcyBub3QganVtcGluZyB0byBhXG4gICAgICAgIC8vIGxvY2F0aW9uIG91dHNpZGUgdGhlIHRyeS9jYXRjaCBibG9jay5cbiAgICAgICAgZmluYWxseUVudHJ5ID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgdmFyIHJlY29yZCA9IGZpbmFsbHlFbnRyeSA/IGZpbmFsbHlFbnRyeS5jb21wbGV0aW9uIDoge307XG4gICAgICByZWNvcmQudHlwZSA9IHR5cGU7XG4gICAgICByZWNvcmQuYXJnID0gYXJnO1xuXG4gICAgICBpZiAoZmluYWxseUVudHJ5KSB7XG4gICAgICAgIHRoaXMubWV0aG9kID0gXCJuZXh0XCI7XG4gICAgICAgIHRoaXMubmV4dCA9IGZpbmFsbHlFbnRyeS5maW5hbGx5TG9jO1xuICAgICAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY29tcGxldGUocmVjb3JkKTtcbiAgICB9LFxuXG4gICAgY29tcGxldGU6IGZ1bmN0aW9uKHJlY29yZCwgYWZ0ZXJMb2MpIHtcbiAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJ0aHJvd1wiKSB7XG4gICAgICAgIHRocm93IHJlY29yZC5hcmc7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZWNvcmQudHlwZSA9PT0gXCJicmVha1wiIHx8XG4gICAgICAgICAgcmVjb3JkLnR5cGUgPT09IFwiY29udGludWVcIikge1xuICAgICAgICB0aGlzLm5leHQgPSByZWNvcmQuYXJnO1xuICAgICAgfSBlbHNlIGlmIChyZWNvcmQudHlwZSA9PT0gXCJyZXR1cm5cIikge1xuICAgICAgICB0aGlzLnJ2YWwgPSB0aGlzLmFyZyA9IHJlY29yZC5hcmc7XG4gICAgICAgIHRoaXMubWV0aG9kID0gXCJyZXR1cm5cIjtcbiAgICAgICAgdGhpcy5uZXh0ID0gXCJlbmRcIjtcbiAgICAgIH0gZWxzZSBpZiAocmVjb3JkLnR5cGUgPT09IFwibm9ybWFsXCIgJiYgYWZ0ZXJMb2MpIHtcbiAgICAgICAgdGhpcy5uZXh0ID0gYWZ0ZXJMb2M7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgIH0sXG5cbiAgICBmaW5pc2g6IGZ1bmN0aW9uKGZpbmFsbHlMb2MpIHtcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRyeUVudHJpZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gdGhpcy50cnlFbnRyaWVzW2ldO1xuICAgICAgICBpZiAoZW50cnkuZmluYWxseUxvYyA9PT0gZmluYWxseUxvYykge1xuICAgICAgICAgIHRoaXMuY29tcGxldGUoZW50cnkuY29tcGxldGlvbiwgZW50cnkuYWZ0ZXJMb2MpO1xuICAgICAgICAgIHJlc2V0VHJ5RW50cnkoZW50cnkpO1xuICAgICAgICAgIHJldHVybiBDb250aW51ZVNlbnRpbmVsO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIFwiY2F0Y2hcIjogZnVuY3Rpb24odHJ5TG9jKSB7XG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50cnlFbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IHRoaXMudHJ5RW50cmllc1tpXTtcbiAgICAgICAgaWYgKGVudHJ5LnRyeUxvYyA9PT0gdHJ5TG9jKSB7XG4gICAgICAgICAgdmFyIHJlY29yZCA9IGVudHJ5LmNvbXBsZXRpb247XG4gICAgICAgICAgaWYgKHJlY29yZC50eXBlID09PSBcInRocm93XCIpIHtcbiAgICAgICAgICAgIHZhciB0aHJvd24gPSByZWNvcmQuYXJnO1xuICAgICAgICAgICAgcmVzZXRUcnlFbnRyeShlbnRyeSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aHJvd247XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGNvbnRleHQuY2F0Y2ggbWV0aG9kIG11c3Qgb25seSBiZSBjYWxsZWQgd2l0aCBhIGxvY2F0aW9uXG4gICAgICAvLyBhcmd1bWVudCB0aGF0IGNvcnJlc3BvbmRzIHRvIGEga25vd24gY2F0Y2ggYmxvY2suXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbGxlZ2FsIGNhdGNoIGF0dGVtcHRcIik7XG4gICAgfSxcblxuICAgIGRlbGVnYXRlWWllbGQ6IGZ1bmN0aW9uKGl0ZXJhYmxlLCByZXN1bHROYW1lLCBuZXh0TG9jKSB7XG4gICAgICB0aGlzLmRlbGVnYXRlID0ge1xuICAgICAgICBpdGVyYXRvcjogdmFsdWVzKGl0ZXJhYmxlKSxcbiAgICAgICAgcmVzdWx0TmFtZTogcmVzdWx0TmFtZSxcbiAgICAgICAgbmV4dExvYzogbmV4dExvY1xuICAgICAgfTtcblxuICAgICAgaWYgKHRoaXMubWV0aG9kID09PSBcIm5leHRcIikge1xuICAgICAgICAvLyBEZWxpYmVyYXRlbHkgZm9yZ2V0IHRoZSBsYXN0IHNlbnQgdmFsdWUgc28gdGhhdCB3ZSBkb24ndFxuICAgICAgICAvLyBhY2NpZGVudGFsbHkgcGFzcyBpdCBvbiB0byB0aGUgZGVsZWdhdGUuXG4gICAgICAgIHRoaXMuYXJnID0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gQ29udGludWVTZW50aW5lbDtcbiAgICB9XG4gIH07XG5cbiAgLy8gUmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoaXMgc2NyaXB0IGlzIGV4ZWN1dGluZyBhcyBhIENvbW1vbkpTIG1vZHVsZVxuICAvLyBvciBub3QsIHJldHVybiB0aGUgcnVudGltZSBvYmplY3Qgc28gdGhhdCB3ZSBjYW4gZGVjbGFyZSB0aGUgdmFyaWFibGVcbiAgLy8gcmVnZW5lcmF0b3JSdW50aW1lIGluIHRoZSBvdXRlciBzY29wZSwgd2hpY2ggYWxsb3dzIHRoaXMgbW9kdWxlIHRvIGJlXG4gIC8vIGluamVjdGVkIGVhc2lseSBieSBgYmluL3JlZ2VuZXJhdG9yIC0taW5jbHVkZS1ydW50aW1lIHNjcmlwdC5qc2AuXG4gIHJldHVybiBleHBvcnRzO1xuXG59KFxuICAvLyBJZiB0aGlzIHNjcmlwdCBpcyBleGVjdXRpbmcgYXMgYSBDb21tb25KUyBtb2R1bGUsIHVzZSBtb2R1bGUuZXhwb3J0c1xuICAvLyBhcyB0aGUgcmVnZW5lcmF0b3JSdW50aW1lIG5hbWVzcGFjZS4gT3RoZXJ3aXNlIGNyZWF0ZSBhIG5ldyBlbXB0eVxuICAvLyBvYmplY3QuIEVpdGhlciB3YXksIHRoZSByZXN1bHRpbmcgb2JqZWN0IHdpbGwgYmUgdXNlZCB0byBpbml0aWFsaXplXG4gIC8vIHRoZSByZWdlbmVyYXRvclJ1bnRpbWUgdmFyaWFibGUgYXQgdGhlIHRvcCBvZiB0aGlzIGZpbGUuXG4gIHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgPyBtb2R1bGUuZXhwb3J0cyA6IHt9XG4pKTtcblxudHJ5IHtcbiAgcmVnZW5lcmF0b3JSdW50aW1lID0gcnVudGltZTtcbn0gY2F0Y2ggKGFjY2lkZW50YWxTdHJpY3RNb2RlKSB7XG4gIC8vIFRoaXMgbW9kdWxlIHNob3VsZCBub3QgYmUgcnVubmluZyBpbiBzdHJpY3QgbW9kZSwgc28gdGhlIGFib3ZlXG4gIC8vIGFzc2lnbm1lbnQgc2hvdWxkIGFsd2F5cyB3b3JrIHVubGVzcyBzb21ldGhpbmcgaXMgbWlzY29uZmlndXJlZC4gSnVzdFxuICAvLyBpbiBjYXNlIHJ1bnRpbWUuanMgYWNjaWRlbnRhbGx5IHJ1bnMgaW4gc3RyaWN0IG1vZGUsIHdlIGNhbiBlc2NhcGVcbiAgLy8gc3RyaWN0IG1vZGUgdXNpbmcgYSBnbG9iYWwgRnVuY3Rpb24gY2FsbC4gVGhpcyBjb3VsZCBjb25jZWl2YWJseSBmYWlsXG4gIC8vIGlmIGEgQ29udGVudCBTZWN1cml0eSBQb2xpY3kgZm9yYmlkcyB1c2luZyBGdW5jdGlvbiwgYnV0IGluIHRoYXQgY2FzZVxuICAvLyB0aGUgcHJvcGVyIHNvbHV0aW9uIGlzIHRvIGZpeCB0aGUgYWNjaWRlbnRhbCBzdHJpY3QgbW9kZSBwcm9ibGVtLiBJZlxuICAvLyB5b3UndmUgbWlzY29uZmlndXJlZCB5b3VyIGJ1bmRsZXIgdG8gZm9yY2Ugc3RyaWN0IG1vZGUgYW5kIGFwcGxpZWQgYVxuICAvLyBDU1AgdG8gZm9yYmlkIEZ1bmN0aW9uLCBhbmQgeW91J3JlIG5vdCB3aWxsaW5nIHRvIGZpeCBlaXRoZXIgb2YgdGhvc2VcbiAgLy8gcHJvYmxlbXMsIHBsZWFzZSBkZXRhaWwgeW91ciB1bmlxdWUgcHJlZGljYW1lbnQgaW4gYSBHaXRIdWIgaXNzdWUuXG4gIEZ1bmN0aW9uKFwiclwiLCBcInJlZ2VuZXJhdG9yUnVudGltZSA9IHJcIikocnVudGltZSk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJyZWdlbmVyYXRvci1ydW50aW1lXCIpO1xuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oYSwgYikge1xuICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IGEgPj0gYiA/IDAgOiBOYU47XG59XG4iLCJpbXBvcnQgYXNjZW5kaW5nIGZyb20gXCIuL2FzY2VuZGluZ1wiO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihjb21wYXJlKSB7XG4gIGlmIChjb21wYXJlLmxlbmd0aCA9PT0gMSkgY29tcGFyZSA9IGFzY2VuZGluZ0NvbXBhcmF0b3IoY29tcGFyZSk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogZnVuY3Rpb24oYSwgeCwgbG8sIGhpKSB7XG4gICAgICBpZiAobG8gPT0gbnVsbCkgbG8gPSAwO1xuICAgICAgaWYgKGhpID09IG51bGwpIGhpID0gYS5sZW5ndGg7XG4gICAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgICAgaWYgKGNvbXBhcmUoYVttaWRdLCB4KSA8IDApIGxvID0gbWlkICsgMTtcbiAgICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsbztcbiAgICB9LFxuICAgIHJpZ2h0OiBmdW5jdGlvbihhLCB4LCBsbywgaGkpIHtcbiAgICAgIGlmIChsbyA9PSBudWxsKSBsbyA9IDA7XG4gICAgICBpZiAoaGkgPT0gbnVsbCkgaGkgPSBhLmxlbmd0aDtcbiAgICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgICBpZiAoY29tcGFyZShhW21pZF0sIHgpID4gMCkgaGkgPSBtaWQ7XG4gICAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gYXNjZW5kaW5nQ29tcGFyYXRvcihmKSB7XG4gIHJldHVybiBmdW5jdGlvbihkLCB4KSB7XG4gICAgcmV0dXJuIGFzY2VuZGluZyhmKGQpLCB4KTtcbiAgfTtcbn1cbiIsImltcG9ydCBhc2NlbmRpbmcgZnJvbSBcIi4vYXNjZW5kaW5nXCI7XG5pbXBvcnQgYmlzZWN0b3IgZnJvbSBcIi4vYmlzZWN0b3JcIjtcblxudmFyIGFzY2VuZGluZ0Jpc2VjdCA9IGJpc2VjdG9yKGFzY2VuZGluZyk7XG5leHBvcnQgdmFyIGJpc2VjdFJpZ2h0ID0gYXNjZW5kaW5nQmlzZWN0LnJpZ2h0O1xuZXhwb3J0IHZhciBiaXNlY3RMZWZ0ID0gYXNjZW5kaW5nQmlzZWN0LmxlZnQ7XG5leHBvcnQgZGVmYXVsdCBiaXNlY3RSaWdodDtcbiIsInZhciBub29wID0ge3ZhbHVlOiBmdW5jdGlvbigpIHt9fTtcblxuZnVuY3Rpb24gZGlzcGF0Y2goKSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gYXJndW1lbnRzLmxlbmd0aCwgXyA9IHt9LCB0OyBpIDwgbjsgKytpKSB7XG4gICAgaWYgKCEodCA9IGFyZ3VtZW50c1tpXSArIFwiXCIpIHx8ICh0IGluIF8pIHx8IC9bXFxzLl0vLnRlc3QodCkpIHRocm93IG5ldyBFcnJvcihcImlsbGVnYWwgdHlwZTogXCIgKyB0KTtcbiAgICBfW3RdID0gW107XG4gIH1cbiAgcmV0dXJuIG5ldyBEaXNwYXRjaChfKTtcbn1cblxuZnVuY3Rpb24gRGlzcGF0Y2goXykge1xuICB0aGlzLl8gPSBfO1xufVxuXG5mdW5jdGlvbiBwYXJzZVR5cGVuYW1lcyh0eXBlbmFtZXMsIHR5cGVzKSB7XG4gIHJldHVybiB0eXBlbmFtZXMudHJpbSgpLnNwbGl0KC9efFxccysvKS5tYXAoZnVuY3Rpb24odCkge1xuICAgIHZhciBuYW1lID0gXCJcIiwgaSA9IHQuaW5kZXhPZihcIi5cIik7XG4gICAgaWYgKGkgPj0gMCkgbmFtZSA9IHQuc2xpY2UoaSArIDEpLCB0ID0gdC5zbGljZSgwLCBpKTtcbiAgICBpZiAodCAmJiAhdHlwZXMuaGFzT3duUHJvcGVydHkodCkpIHRocm93IG5ldyBFcnJvcihcInVua25vd24gdHlwZTogXCIgKyB0KTtcbiAgICByZXR1cm4ge3R5cGU6IHQsIG5hbWU6IG5hbWV9O1xuICB9KTtcbn1cblxuRGlzcGF0Y2gucHJvdG90eXBlID0gZGlzcGF0Y2gucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogRGlzcGF0Y2gsXG4gIG9uOiBmdW5jdGlvbih0eXBlbmFtZSwgY2FsbGJhY2spIHtcbiAgICB2YXIgXyA9IHRoaXMuXyxcbiAgICAgICAgVCA9IHBhcnNlVHlwZW5hbWVzKHR5cGVuYW1lICsgXCJcIiwgXyksXG4gICAgICAgIHQsXG4gICAgICAgIGkgPSAtMSxcbiAgICAgICAgbiA9IFQubGVuZ3RoO1xuXG4gICAgLy8gSWYgbm8gY2FsbGJhY2sgd2FzIHNwZWNpZmllZCwgcmV0dXJuIHRoZSBjYWxsYmFjayBvZiB0aGUgZ2l2ZW4gdHlwZSBhbmQgbmFtZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKHQgPSAodHlwZW5hbWUgPSBUW2ldKS50eXBlKSAmJiAodCA9IGdldChfW3RdLCB0eXBlbmFtZS5uYW1lKSkpIHJldHVybiB0O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIElmIGEgdHlwZSB3YXMgc3BlY2lmaWVkLCBzZXQgdGhlIGNhbGxiYWNrIGZvciB0aGUgZ2l2ZW4gdHlwZSBhbmQgbmFtZS5cbiAgICAvLyBPdGhlcndpc2UsIGlmIGEgbnVsbCBjYWxsYmFjayB3YXMgc3BlY2lmaWVkLCByZW1vdmUgY2FsbGJhY2tzIG9mIHRoZSBnaXZlbiBuYW1lLlxuICAgIGlmIChjYWxsYmFjayAhPSBudWxsICYmIHR5cGVvZiBjYWxsYmFjayAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGNhbGxiYWNrOiBcIiArIGNhbGxiYWNrKTtcbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgaWYgKHQgPSAodHlwZW5hbWUgPSBUW2ldKS50eXBlKSBfW3RdID0gc2V0KF9bdF0sIHR5cGVuYW1lLm5hbWUsIGNhbGxiYWNrKTtcbiAgICAgIGVsc2UgaWYgKGNhbGxiYWNrID09IG51bGwpIGZvciAodCBpbiBfKSBfW3RdID0gc2V0KF9bdF0sIHR5cGVuYW1lLm5hbWUsIG51bGwpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICBjb3B5OiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29weSA9IHt9LCBfID0gdGhpcy5fO1xuICAgIGZvciAodmFyIHQgaW4gXykgY29weVt0XSA9IF9bdF0uc2xpY2UoKTtcbiAgICByZXR1cm4gbmV3IERpc3BhdGNoKGNvcHkpO1xuICB9LFxuICBjYWxsOiBmdW5jdGlvbih0eXBlLCB0aGF0KSB7XG4gICAgaWYgKChuID0gYXJndW1lbnRzLmxlbmd0aCAtIDIpID4gMCkgZm9yICh2YXIgYXJncyA9IG5ldyBBcnJheShuKSwgaSA9IDAsIG4sIHQ7IGkgPCBuOyArK2kpIGFyZ3NbaV0gPSBhcmd1bWVudHNbaSArIDJdO1xuICAgIGlmICghdGhpcy5fLmhhc093blByb3BlcnR5KHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGU6IFwiICsgdHlwZSk7XG4gICAgZm9yICh0ID0gdGhpcy5fW3R5cGVdLCBpID0gMCwgbiA9IHQubGVuZ3RoOyBpIDwgbjsgKytpKSB0W2ldLnZhbHVlLmFwcGx5KHRoYXQsIGFyZ3MpO1xuICB9LFxuICBhcHBseTogZnVuY3Rpb24odHlwZSwgdGhhdCwgYXJncykge1xuICAgIGlmICghdGhpcy5fLmhhc093blByb3BlcnR5KHR5cGUpKSB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHR5cGU6IFwiICsgdHlwZSk7XG4gICAgZm9yICh2YXIgdCA9IHRoaXMuX1t0eXBlXSwgaSA9IDAsIG4gPSB0Lmxlbmd0aDsgaSA8IG47ICsraSkgdFtpXS52YWx1ZS5hcHBseSh0aGF0LCBhcmdzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0KHR5cGUsIG5hbWUpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSB0eXBlLmxlbmd0aCwgYzsgaSA8IG47ICsraSkge1xuICAgIGlmICgoYyA9IHR5cGVbaV0pLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHJldHVybiBjLnZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXQodHlwZSwgbmFtZSwgY2FsbGJhY2spIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSB0eXBlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIGlmICh0eXBlW2ldLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgIHR5cGVbaV0gPSBub29wLCB0eXBlID0gdHlwZS5zbGljZSgwLCBpKS5jb25jYXQodHlwZS5zbGljZShpICsgMSkpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIGlmIChjYWxsYmFjayAhPSBudWxsKSB0eXBlLnB1c2goe25hbWU6IG5hbWUsIHZhbHVlOiBjYWxsYmFja30pO1xuICByZXR1cm4gdHlwZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZGlzcGF0Y2g7XG4iLCJpbXBvcnQge2Rpc3BhdGNofSBmcm9tIFwiZDMtZGlzcGF0Y2hcIjtcbmltcG9ydCB7dGltZXIsIHRpbWVvdXR9IGZyb20gXCJkMy10aW1lclwiO1xuXG52YXIgZW1wdHlPbiA9IGRpc3BhdGNoKFwic3RhcnRcIiwgXCJlbmRcIiwgXCJjYW5jZWxcIiwgXCJpbnRlcnJ1cHRcIik7XG52YXIgZW1wdHlUd2VlbiA9IFtdO1xuXG5leHBvcnQgdmFyIENSRUFURUQgPSAwO1xuZXhwb3J0IHZhciBTQ0hFRFVMRUQgPSAxO1xuZXhwb3J0IHZhciBTVEFSVElORyA9IDI7XG5leHBvcnQgdmFyIFNUQVJURUQgPSAzO1xuZXhwb3J0IHZhciBSVU5OSU5HID0gNDtcbmV4cG9ydCB2YXIgRU5ESU5HID0gNTtcbmV4cG9ydCB2YXIgRU5ERUQgPSA2O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihub2RlLCBuYW1lLCBpZCwgaW5kZXgsIGdyb3VwLCB0aW1pbmcpIHtcbiAgdmFyIHNjaGVkdWxlcyA9IG5vZGUuX190cmFuc2l0aW9uO1xuICBpZiAoIXNjaGVkdWxlcykgbm9kZS5fX3RyYW5zaXRpb24gPSB7fTtcbiAgZWxzZSBpZiAoaWQgaW4gc2NoZWR1bGVzKSByZXR1cm47XG4gIGNyZWF0ZShub2RlLCBpZCwge1xuICAgIG5hbWU6IG5hbWUsXG4gICAgaW5kZXg6IGluZGV4LCAvLyBGb3IgY29udGV4dCBkdXJpbmcgY2FsbGJhY2suXG4gICAgZ3JvdXA6IGdyb3VwLCAvLyBGb3IgY29udGV4dCBkdXJpbmcgY2FsbGJhY2suXG4gICAgb246IGVtcHR5T24sXG4gICAgdHdlZW46IGVtcHR5VHdlZW4sXG4gICAgdGltZTogdGltaW5nLnRpbWUsXG4gICAgZGVsYXk6IHRpbWluZy5kZWxheSxcbiAgICBkdXJhdGlvbjogdGltaW5nLmR1cmF0aW9uLFxuICAgIGVhc2U6IHRpbWluZy5lYXNlLFxuICAgIHRpbWVyOiBudWxsLFxuICAgIHN0YXRlOiBDUkVBVEVEXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5pdChub2RlLCBpZCkge1xuICB2YXIgc2NoZWR1bGUgPSBnZXQobm9kZSwgaWQpO1xuICBpZiAoc2NoZWR1bGUuc3RhdGUgPiBDUkVBVEVEKSB0aHJvdyBuZXcgRXJyb3IoXCJ0b28gbGF0ZTsgYWxyZWFkeSBzY2hlZHVsZWRcIik7XG4gIHJldHVybiBzY2hlZHVsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldChub2RlLCBpZCkge1xuICB2YXIgc2NoZWR1bGUgPSBnZXQobm9kZSwgaWQpO1xuICBpZiAoc2NoZWR1bGUuc3RhdGUgPiBTVEFSVEVEKSB0aHJvdyBuZXcgRXJyb3IoXCJ0b28gbGF0ZTsgYWxyZWFkeSBydW5uaW5nXCIpO1xuICByZXR1cm4gc2NoZWR1bGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXQobm9kZSwgaWQpIHtcbiAgdmFyIHNjaGVkdWxlID0gbm9kZS5fX3RyYW5zaXRpb247XG4gIGlmICghc2NoZWR1bGUgfHwgIShzY2hlZHVsZSA9IHNjaGVkdWxlW2lkXSkpIHRocm93IG5ldyBFcnJvcihcInRyYW5zaXRpb24gbm90IGZvdW5kXCIpO1xuICByZXR1cm4gc2NoZWR1bGU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZShub2RlLCBpZCwgc2VsZikge1xuICB2YXIgc2NoZWR1bGVzID0gbm9kZS5fX3RyYW5zaXRpb24sXG4gICAgICB0d2VlbjtcblxuICAvLyBJbml0aWFsaXplIHRoZSBzZWxmIHRpbWVyIHdoZW4gdGhlIHRyYW5zaXRpb24gaXMgY3JlYXRlZC5cbiAgLy8gTm90ZSB0aGUgYWN0dWFsIGRlbGF5IGlzIG5vdCBrbm93biB1bnRpbCB0aGUgZmlyc3QgY2FsbGJhY2shXG4gIHNjaGVkdWxlc1tpZF0gPSBzZWxmO1xuICBzZWxmLnRpbWVyID0gdGltZXIoc2NoZWR1bGUsIDAsIHNlbGYudGltZSk7XG5cbiAgZnVuY3Rpb24gc2NoZWR1bGUoZWxhcHNlZCkge1xuICAgIHNlbGYuc3RhdGUgPSBTQ0hFRFVMRUQ7XG4gICAgc2VsZi50aW1lci5yZXN0YXJ0KHN0YXJ0LCBzZWxmLmRlbGF5LCBzZWxmLnRpbWUpO1xuXG4gICAgLy8gSWYgdGhlIGVsYXBzZWQgZGVsYXkgaXMgbGVzcyB0aGFuIG91ciBmaXJzdCBzbGVlcCwgc3RhcnQgaW1tZWRpYXRlbHkuXG4gICAgaWYgKHNlbGYuZGVsYXkgPD0gZWxhcHNlZCkgc3RhcnQoZWxhcHNlZCAtIHNlbGYuZGVsYXkpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnQoZWxhcHNlZCkge1xuICAgIHZhciBpLCBqLCBuLCBvO1xuXG4gICAgLy8gSWYgdGhlIHN0YXRlIGlzIG5vdCBTQ0hFRFVMRUQsIHRoZW4gd2UgcHJldmlvdXNseSBlcnJvcmVkIG9uIHN0YXJ0LlxuICAgIGlmIChzZWxmLnN0YXRlICE9PSBTQ0hFRFVMRUQpIHJldHVybiBzdG9wKCk7XG5cbiAgICBmb3IgKGkgaW4gc2NoZWR1bGVzKSB7XG4gICAgICBvID0gc2NoZWR1bGVzW2ldO1xuICAgICAgaWYgKG8ubmFtZSAhPT0gc2VsZi5uYW1lKSBjb250aW51ZTtcblxuICAgICAgLy8gV2hpbGUgdGhpcyBlbGVtZW50IGFscmVhZHkgaGFzIGEgc3RhcnRpbmcgdHJhbnNpdGlvbiBkdXJpbmcgdGhpcyBmcmFtZSxcbiAgICAgIC8vIGRlZmVyIHN0YXJ0aW5nIGFuIGludGVycnVwdGluZyB0cmFuc2l0aW9uIHVudGlsIHRoYXQgdHJhbnNpdGlvbiBoYXMgYVxuICAgICAgLy8gY2hhbmNlIHRvIHRpY2sgKGFuZCBwb3NzaWJseSBlbmQpOyBzZWUgZDMvZDMtdHJhbnNpdGlvbiM1NCFcbiAgICAgIGlmIChvLnN0YXRlID09PSBTVEFSVEVEKSByZXR1cm4gdGltZW91dChzdGFydCk7XG5cbiAgICAgIC8vIEludGVycnVwdCB0aGUgYWN0aXZlIHRyYW5zaXRpb24sIGlmIGFueS5cbiAgICAgIGlmIChvLnN0YXRlID09PSBSVU5OSU5HKSB7XG4gICAgICAgIG8uc3RhdGUgPSBFTkRFRDtcbiAgICAgICAgby50aW1lci5zdG9wKCk7XG4gICAgICAgIG8ub24uY2FsbChcImludGVycnVwdFwiLCBub2RlLCBub2RlLl9fZGF0YV9fLCBvLmluZGV4LCBvLmdyb3VwKTtcbiAgICAgICAgZGVsZXRlIHNjaGVkdWxlc1tpXTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2FuY2VsIGFueSBwcmUtZW1wdGVkIHRyYW5zaXRpb25zLlxuICAgICAgZWxzZSBpZiAoK2kgPCBpZCkge1xuICAgICAgICBvLnN0YXRlID0gRU5ERUQ7XG4gICAgICAgIG8udGltZXIuc3RvcCgpO1xuICAgICAgICBvLm9uLmNhbGwoXCJjYW5jZWxcIiwgbm9kZSwgbm9kZS5fX2RhdGFfXywgby5pbmRleCwgby5ncm91cCk7XG4gICAgICAgIGRlbGV0ZSBzY2hlZHVsZXNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGVmZXIgdGhlIGZpcnN0IHRpY2sgdG8gZW5kIG9mIHRoZSBjdXJyZW50IGZyYW1lOyBzZWUgZDMvZDMjMTU3Ni5cbiAgICAvLyBOb3RlIHRoZSB0cmFuc2l0aW9uIG1heSBiZSBjYW5jZWxlZCBhZnRlciBzdGFydCBhbmQgYmVmb3JlIHRoZSBmaXJzdCB0aWNrIVxuICAgIC8vIE5vdGUgdGhpcyBtdXN0IGJlIHNjaGVkdWxlZCBiZWZvcmUgdGhlIHN0YXJ0IGV2ZW50OyBzZWUgZDMvZDMtdHJhbnNpdGlvbiMxNiFcbiAgICAvLyBBc3N1bWluZyB0aGlzIGlzIHN1Y2Nlc3NmdWwsIHN1YnNlcXVlbnQgY2FsbGJhY2tzIGdvIHN0cmFpZ2h0IHRvIHRpY2suXG4gICAgdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZWxmLnN0YXRlID09PSBTVEFSVEVEKSB7XG4gICAgICAgIHNlbGYuc3RhdGUgPSBSVU5OSU5HO1xuICAgICAgICBzZWxmLnRpbWVyLnJlc3RhcnQodGljaywgc2VsZi5kZWxheSwgc2VsZi50aW1lKTtcbiAgICAgICAgdGljayhlbGFwc2VkKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIERpc3BhdGNoIHRoZSBzdGFydCBldmVudC5cbiAgICAvLyBOb3RlIHRoaXMgbXVzdCBiZSBkb25lIGJlZm9yZSB0aGUgdHdlZW4gYXJlIGluaXRpYWxpemVkLlxuICAgIHNlbGYuc3RhdGUgPSBTVEFSVElORztcbiAgICBzZWxmLm9uLmNhbGwoXCJzdGFydFwiLCBub2RlLCBub2RlLl9fZGF0YV9fLCBzZWxmLmluZGV4LCBzZWxmLmdyb3VwKTtcbiAgICBpZiAoc2VsZi5zdGF0ZSAhPT0gU1RBUlRJTkcpIHJldHVybjsgLy8gaW50ZXJydXB0ZWRcbiAgICBzZWxmLnN0YXRlID0gU1RBUlRFRDtcblxuICAgIC8vIEluaXRpYWxpemUgdGhlIHR3ZWVuLCBkZWxldGluZyBudWxsIHR3ZWVuLlxuICAgIHR3ZWVuID0gbmV3IEFycmF5KG4gPSBzZWxmLnR3ZWVuLmxlbmd0aCk7XG4gICAgZm9yIChpID0gMCwgaiA9IC0xOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAobyA9IHNlbGYudHdlZW5baV0udmFsdWUuY2FsbChub2RlLCBub2RlLl9fZGF0YV9fLCBzZWxmLmluZGV4LCBzZWxmLmdyb3VwKSkge1xuICAgICAgICB0d2VlblsrK2pdID0gbztcbiAgICAgIH1cbiAgICB9XG4gICAgdHdlZW4ubGVuZ3RoID0gaiArIDE7XG4gIH1cblxuICBmdW5jdGlvbiB0aWNrKGVsYXBzZWQpIHtcbiAgICB2YXIgdCA9IGVsYXBzZWQgPCBzZWxmLmR1cmF0aW9uID8gc2VsZi5lYXNlLmNhbGwobnVsbCwgZWxhcHNlZCAvIHNlbGYuZHVyYXRpb24pIDogKHNlbGYudGltZXIucmVzdGFydChzdG9wKSwgc2VsZi5zdGF0ZSA9IEVORElORywgMSksXG4gICAgICAgIGkgPSAtMSxcbiAgICAgICAgbiA9IHR3ZWVuLmxlbmd0aDtcblxuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICB0d2VlbltpXS5jYWxsKG5vZGUsIHQpO1xuICAgIH1cblxuICAgIC8vIERpc3BhdGNoIHRoZSBlbmQgZXZlbnQuXG4gICAgaWYgKHNlbGYuc3RhdGUgPT09IEVORElORykge1xuICAgICAgc2VsZi5vbi5jYWxsKFwiZW5kXCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIHNlbGYuaW5kZXgsIHNlbGYuZ3JvdXApO1xuICAgICAgc3RvcCgpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgc2VsZi5zdGF0ZSA9IEVOREVEO1xuICAgIHNlbGYudGltZXIuc3RvcCgpO1xuICAgIGRlbGV0ZSBzY2hlZHVsZXNbaWRdO1xuICAgIGZvciAodmFyIGkgaW4gc2NoZWR1bGVzKSByZXR1cm47IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgICBkZWxldGUgbm9kZS5fX3RyYW5zaXRpb247XG4gIH1cbn1cbiIsImV4cG9ydCB2YXIgcHJlZml4ID0gXCIkXCI7XG5cbmZ1bmN0aW9uIE1hcCgpIHt9XG5cbk1hcC5wcm90b3R5cGUgPSBtYXAucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWFwLFxuICBoYXM6IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiAocHJlZml4ICsga2V5KSBpbiB0aGlzO1xuICB9LFxuICBnZXQ6IGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiB0aGlzW3ByZWZpeCArIGtleV07XG4gIH0sXG4gIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSkge1xuICAgIHRoaXNbcHJlZml4ICsga2V5XSA9IHZhbHVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuICByZW1vdmU6IGZ1bmN0aW9uKGtleSkge1xuICAgIHZhciBwcm9wZXJ0eSA9IHByZWZpeCArIGtleTtcbiAgICByZXR1cm4gcHJvcGVydHkgaW4gdGhpcyAmJiBkZWxldGUgdGhpc1twcm9wZXJ0eV07XG4gIH0sXG4gIGNsZWFyOiBmdW5jdGlvbigpIHtcbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0aGlzKSBpZiAocHJvcGVydHlbMF0gPT09IHByZWZpeCkgZGVsZXRlIHRoaXNbcHJvcGVydHldO1xuICB9LFxuICBrZXlzOiBmdW5jdGlvbigpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHRoaXMpIGlmIChwcm9wZXJ0eVswXSA9PT0gcHJlZml4KSBrZXlzLnB1c2gocHJvcGVydHkuc2xpY2UoMSkpO1xuICAgIHJldHVybiBrZXlzO1xuICB9LFxuICB2YWx1ZXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0aGlzKSBpZiAocHJvcGVydHlbMF0gPT09IHByZWZpeCkgdmFsdWVzLnB1c2godGhpc1twcm9wZXJ0eV0pO1xuICAgIHJldHVybiB2YWx1ZXM7XG4gIH0sXG4gIGVudHJpZXM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbnRyaWVzID0gW107XG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdGhpcykgaWYgKHByb3BlcnR5WzBdID09PSBwcmVmaXgpIGVudHJpZXMucHVzaCh7a2V5OiBwcm9wZXJ0eS5zbGljZSgxKSwgdmFsdWU6IHRoaXNbcHJvcGVydHldfSk7XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH0sXG4gIHNpemU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzaXplID0gMDtcbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0aGlzKSBpZiAocHJvcGVydHlbMF0gPT09IHByZWZpeCkgKytzaXplO1xuICAgIHJldHVybiBzaXplO1xuICB9LFxuICBlbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdGhpcykgaWYgKHByb3BlcnR5WzBdID09PSBwcmVmaXgpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgZWFjaDogZnVuY3Rpb24oZikge1xuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHRoaXMpIGlmIChwcm9wZXJ0eVswXSA9PT0gcHJlZml4KSBmKHRoaXNbcHJvcGVydHldLCBwcm9wZXJ0eS5zbGljZSgxKSwgdGhpcyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIG1hcChvYmplY3QsIGYpIHtcbiAgdmFyIG1hcCA9IG5ldyBNYXA7XG5cbiAgLy8gQ29weSBjb25zdHJ1Y3Rvci5cbiAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIE1hcCkgb2JqZWN0LmVhY2goZnVuY3Rpb24odmFsdWUsIGtleSkgeyBtYXAuc2V0KGtleSwgdmFsdWUpOyB9KTtcblxuICAvLyBJbmRleCBhcnJheSBieSBudW1lcmljIGluZGV4IG9yIHNwZWNpZmllZCBrZXkgZnVuY3Rpb24uXG4gIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgIHZhciBpID0gLTEsXG4gICAgICAgIG4gPSBvYmplY3QubGVuZ3RoLFxuICAgICAgICBvO1xuXG4gICAgaWYgKGYgPT0gbnVsbCkgd2hpbGUgKCsraSA8IG4pIG1hcC5zZXQoaSwgb2JqZWN0W2ldKTtcbiAgICBlbHNlIHdoaWxlICgrK2kgPCBuKSBtYXAuc2V0KGYobyA9IG9iamVjdFtpXSwgaSwgb2JqZWN0KSwgbyk7XG4gIH1cblxuICAvLyBDb252ZXJ0IG9iamVjdCB0byBtYXAuXG4gIGVsc2UgaWYgKG9iamVjdCkgZm9yICh2YXIga2V5IGluIG9iamVjdCkgbWFwLnNldChrZXksIG9iamVjdFtrZXldKTtcblxuICByZXR1cm4gbWFwO1xufVxuXG5leHBvcnQgZGVmYXVsdCBtYXA7XG4iLCJpbXBvcnQge2RlZmF1bHQgYXMgbWFwLCBwcmVmaXh9IGZyb20gXCIuL21hcFwiO1xuXG5mdW5jdGlvbiBTZXQoKSB7fVxuXG52YXIgcHJvdG8gPSBtYXAucHJvdG90eXBlO1xuXG5TZXQucHJvdG90eXBlID0gc2V0LnByb3RvdHlwZSA9IHtcbiAgY29uc3RydWN0b3I6IFNldCxcbiAgaGFzOiBwcm90by5oYXMsXG4gIGFkZDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YWx1ZSArPSBcIlwiO1xuICAgIHRoaXNbcHJlZml4ICsgdmFsdWVdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG4gIHJlbW92ZTogcHJvdG8ucmVtb3ZlLFxuICBjbGVhcjogcHJvdG8uY2xlYXIsXG4gIHZhbHVlczogcHJvdG8ua2V5cyxcbiAgc2l6ZTogcHJvdG8uc2l6ZSxcbiAgZW1wdHk6IHByb3RvLmVtcHR5LFxuICBlYWNoOiBwcm90by5lYWNoXG59O1xuXG5mdW5jdGlvbiBzZXQob2JqZWN0LCBmKSB7XG4gIHZhciBzZXQgPSBuZXcgU2V0O1xuXG4gIC8vIENvcHkgY29uc3RydWN0b3IuXG4gIGlmIChvYmplY3QgaW5zdGFuY2VvZiBTZXQpIG9iamVjdC5lYWNoKGZ1bmN0aW9uKHZhbHVlKSB7IHNldC5hZGQodmFsdWUpOyB9KTtcblxuICAvLyBPdGhlcndpc2UsIGFzc3VtZSBpdOKAmXMgYW4gYXJyYXkuXG4gIGVsc2UgaWYgKG9iamVjdCkge1xuICAgIHZhciBpID0gLTEsIG4gPSBvYmplY3QubGVuZ3RoO1xuICAgIGlmIChmID09IG51bGwpIHdoaWxlICgrK2kgPCBuKSBzZXQuYWRkKG9iamVjdFtpXSk7XG4gICAgZWxzZSB3aGlsZSAoKytpIDwgbikgc2V0LmFkZChmKG9iamVjdFtpXSwgaSwgb2JqZWN0KSk7XG4gIH1cblxuICByZXR1cm4gc2V0O1xufVxuXG5leHBvcnQgZGVmYXVsdCBzZXQ7XG4iLCJmdW5jdGlvbiByZXNwb25zZUpzb24ocmVzcG9uc2UpIHtcbiAgaWYgKCFyZXNwb25zZS5vaykgdGhyb3cgbmV3IEVycm9yKHJlc3BvbnNlLnN0YXR1cyArIFwiIFwiICsgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XG4gIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwNCB8fCByZXNwb25zZS5zdGF0dXMgPT09IDIwNSkgcmV0dXJuO1xuICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbihpbnB1dCwgaW5pdCkge1xuICByZXR1cm4gZmV0Y2goaW5wdXQsIGluaXQpLnRoZW4ocmVzcG9uc2VKc29uKTtcbn1cbiIsImltcG9ydCB7ZGlzcGF0Y2h9IGZyb20gXCJkMy1kaXNwYXRjaFwiO1xuaW1wb3J0IHt0aW1lciwgdGltZW91dH0gZnJvbSBcImQzLXRpbWVyXCI7XG5cbnZhciBlbXB0eU9uID0gZGlzcGF0Y2goXCJzdGFydFwiLCBcImVuZFwiLCBcImNhbmNlbFwiLCBcImludGVycnVwdFwiKTtcbnZhciBlbXB0eVR3ZWVuID0gW107XG5cbmV4cG9ydCB2YXIgQ1JFQVRFRCA9IDA7XG5leHBvcnQgdmFyIFNDSEVEVUxFRCA9IDE7XG5leHBvcnQgdmFyIFNUQVJUSU5HID0gMjtcbmV4cG9ydCB2YXIgU1RBUlRFRCA9IDM7XG5leHBvcnQgdmFyIFJVTk5JTkcgPSA0O1xuZXhwb3J0IHZhciBFTkRJTkcgPSA1O1xuZXhwb3J0IHZhciBFTkRFRCA9IDY7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKG5vZGUsIG5hbWUsIGlkLCBpbmRleCwgZ3JvdXAsIHRpbWluZykge1xuICB2YXIgc2NoZWR1bGVzID0gbm9kZS5fX3RyYW5zaXRpb247XG4gIGlmICghc2NoZWR1bGVzKSBub2RlLl9fdHJhbnNpdGlvbiA9IHt9O1xuICBlbHNlIGlmIChpZCBpbiBzY2hlZHVsZXMpIHJldHVybjtcbiAgY3JlYXRlKG5vZGUsIGlkLCB7XG4gICAgbmFtZTogbmFtZSxcbiAgICBpbmRleDogaW5kZXgsIC8vIEZvciBjb250ZXh0IGR1cmluZyBjYWxsYmFjay5cbiAgICBncm91cDogZ3JvdXAsIC8vIEZvciBjb250ZXh0IGR1cmluZyBjYWxsYmFjay5cbiAgICBvbjogZW1wdHlPbixcbiAgICB0d2VlbjogZW1wdHlUd2VlbixcbiAgICB0aW1lOiB0aW1pbmcudGltZSxcbiAgICBkZWxheTogdGltaW5nLmRlbGF5LFxuICAgIGR1cmF0aW9uOiB0aW1pbmcuZHVyYXRpb24sXG4gICAgZWFzZTogdGltaW5nLmVhc2UsXG4gICAgdGltZXI6IG51bGwsXG4gICAgc3RhdGU6IENSRUFURURcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbml0KG5vZGUsIGlkKSB7XG4gIHZhciBzY2hlZHVsZSA9IGdldChub2RlLCBpZCk7XG4gIGlmIChzY2hlZHVsZS5zdGF0ZSA+IENSRUFURUQpIHRocm93IG5ldyBFcnJvcihcInRvbyBsYXRlOyBhbHJlYWR5IHNjaGVkdWxlZFwiKTtcbiAgcmV0dXJuIHNjaGVkdWxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0KG5vZGUsIGlkKSB7XG4gIHZhciBzY2hlZHVsZSA9IGdldChub2RlLCBpZCk7XG4gIGlmIChzY2hlZHVsZS5zdGF0ZSA+IFNUQVJURUQpIHRocm93IG5ldyBFcnJvcihcInRvbyBsYXRlOyBhbHJlYWR5IHJ1bm5pbmdcIik7XG4gIHJldHVybiBzY2hlZHVsZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldChub2RlLCBpZCkge1xuICB2YXIgc2NoZWR1bGUgPSBub2RlLl9fdHJhbnNpdGlvbjtcbiAgaWYgKCFzY2hlZHVsZSB8fCAhKHNjaGVkdWxlID0gc2NoZWR1bGVbaWRdKSkgdGhyb3cgbmV3IEVycm9yKFwidHJhbnNpdGlvbiBub3QgZm91bmRcIik7XG4gIHJldHVybiBzY2hlZHVsZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlKG5vZGUsIGlkLCBzZWxmKSB7XG4gIHZhciBzY2hlZHVsZXMgPSBub2RlLl9fdHJhbnNpdGlvbixcbiAgICAgIHR3ZWVuO1xuXG4gIC8vIEluaXRpYWxpemUgdGhlIHNlbGYgdGltZXIgd2hlbiB0aGUgdHJhbnNpdGlvbiBpcyBjcmVhdGVkLlxuICAvLyBOb3RlIHRoZSBhY3R1YWwgZGVsYXkgaXMgbm90IGtub3duIHVudGlsIHRoZSBmaXJzdCBjYWxsYmFjayFcbiAgc2NoZWR1bGVzW2lkXSA9IHNlbGY7XG4gIHNlbGYudGltZXIgPSB0aW1lcihzY2hlZHVsZSwgMCwgc2VsZi50aW1lKTtcblxuICBmdW5jdGlvbiBzY2hlZHVsZShlbGFwc2VkKSB7XG4gICAgc2VsZi5zdGF0ZSA9IFNDSEVEVUxFRDtcbiAgICBzZWxmLnRpbWVyLnJlc3RhcnQoc3RhcnQsIHNlbGYuZGVsYXksIHNlbGYudGltZSk7XG5cbiAgICAvLyBJZiB0aGUgZWxhcHNlZCBkZWxheSBpcyBsZXNzIHRoYW4gb3VyIGZpcnN0IHNsZWVwLCBzdGFydCBpbW1lZGlhdGVseS5cbiAgICBpZiAoc2VsZi5kZWxheSA8PSBlbGFwc2VkKSBzdGFydChlbGFwc2VkIC0gc2VsZi5kZWxheSk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydChlbGFwc2VkKSB7XG4gICAgdmFyIGksIGosIG4sIG87XG5cbiAgICAvLyBJZiB0aGUgc3RhdGUgaXMgbm90IFNDSEVEVUxFRCwgdGhlbiB3ZSBwcmV2aW91c2x5IGVycm9yZWQgb24gc3RhcnQuXG4gICAgaWYgKHNlbGYuc3RhdGUgIT09IFNDSEVEVUxFRCkgcmV0dXJuIHN0b3AoKTtcblxuICAgIGZvciAoaSBpbiBzY2hlZHVsZXMpIHtcbiAgICAgIG8gPSBzY2hlZHVsZXNbaV07XG4gICAgICBpZiAoby5uYW1lICE9PSBzZWxmLm5hbWUpIGNvbnRpbnVlO1xuXG4gICAgICAvLyBXaGlsZSB0aGlzIGVsZW1lbnQgYWxyZWFkeSBoYXMgYSBzdGFydGluZyB0cmFuc2l0aW9uIGR1cmluZyB0aGlzIGZyYW1lLFxuICAgICAgLy8gZGVmZXIgc3RhcnRpbmcgYW4gaW50ZXJydXB0aW5nIHRyYW5zaXRpb24gdW50aWwgdGhhdCB0cmFuc2l0aW9uIGhhcyBhXG4gICAgICAvLyBjaGFuY2UgdG8gdGljayAoYW5kIHBvc3NpYmx5IGVuZCk7IHNlZSBkMy9kMy10cmFuc2l0aW9uIzU0IVxuICAgICAgaWYgKG8uc3RhdGUgPT09IFNUQVJURUQpIHJldHVybiB0aW1lb3V0KHN0YXJ0KTtcblxuICAgICAgLy8gSW50ZXJydXB0IHRoZSBhY3RpdmUgdHJhbnNpdGlvbiwgaWYgYW55LlxuICAgICAgaWYgKG8uc3RhdGUgPT09IFJVTk5JTkcpIHtcbiAgICAgICAgby5zdGF0ZSA9IEVOREVEO1xuICAgICAgICBvLnRpbWVyLnN0b3AoKTtcbiAgICAgICAgby5vbi5jYWxsKFwiaW50ZXJydXB0XCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIG8uaW5kZXgsIG8uZ3JvdXApO1xuICAgICAgICBkZWxldGUgc2NoZWR1bGVzW2ldO1xuICAgICAgfVxuXG4gICAgICAvLyBDYW5jZWwgYW55IHByZS1lbXB0ZWQgdHJhbnNpdGlvbnMuXG4gICAgICBlbHNlIGlmICgraSA8IGlkKSB7XG4gICAgICAgIG8uc3RhdGUgPSBFTkRFRDtcbiAgICAgICAgby50aW1lci5zdG9wKCk7XG4gICAgICAgIG8ub24uY2FsbChcImNhbmNlbFwiLCBub2RlLCBub2RlLl9fZGF0YV9fLCBvLmluZGV4LCBvLmdyb3VwKTtcbiAgICAgICAgZGVsZXRlIHNjaGVkdWxlc1tpXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZWZlciB0aGUgZmlyc3QgdGljayB0byBlbmQgb2YgdGhlIGN1cnJlbnQgZnJhbWU7IHNlZSBkMy9kMyMxNTc2LlxuICAgIC8vIE5vdGUgdGhlIHRyYW5zaXRpb24gbWF5IGJlIGNhbmNlbGVkIGFmdGVyIHN0YXJ0IGFuZCBiZWZvcmUgdGhlIGZpcnN0IHRpY2shXG4gICAgLy8gTm90ZSB0aGlzIG11c3QgYmUgc2NoZWR1bGVkIGJlZm9yZSB0aGUgc3RhcnQgZXZlbnQ7IHNlZSBkMy9kMy10cmFuc2l0aW9uIzE2IVxuICAgIC8vIEFzc3VtaW5nIHRoaXMgaXMgc3VjY2Vzc2Z1bCwgc3Vic2VxdWVudCBjYWxsYmFja3MgZ28gc3RyYWlnaHQgdG8gdGljay5cbiAgICB0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNlbGYuc3RhdGUgPT09IFNUQVJURUQpIHtcbiAgICAgICAgc2VsZi5zdGF0ZSA9IFJVTk5JTkc7XG4gICAgICAgIHNlbGYudGltZXIucmVzdGFydCh0aWNrLCBzZWxmLmRlbGF5LCBzZWxmLnRpbWUpO1xuICAgICAgICB0aWNrKGVsYXBzZWQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gRGlzcGF0Y2ggdGhlIHN0YXJ0IGV2ZW50LlxuICAgIC8vIE5vdGUgdGhpcyBtdXN0IGJlIGRvbmUgYmVmb3JlIHRoZSB0d2VlbiBhcmUgaW5pdGlhbGl6ZWQuXG4gICAgc2VsZi5zdGF0ZSA9IFNUQVJUSU5HO1xuICAgIHNlbGYub24uY2FsbChcInN0YXJ0XCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIHNlbGYuaW5kZXgsIHNlbGYuZ3JvdXApO1xuICAgIGlmIChzZWxmLnN0YXRlICE9PSBTVEFSVElORykgcmV0dXJuOyAvLyBpbnRlcnJ1cHRlZFxuICAgIHNlbGYuc3RhdGUgPSBTVEFSVEVEO1xuXG4gICAgLy8gSW5pdGlhbGl6ZSB0aGUgdHdlZW4sIGRlbGV0aW5nIG51bGwgdHdlZW4uXG4gICAgdHdlZW4gPSBuZXcgQXJyYXkobiA9IHNlbGYudHdlZW4ubGVuZ3RoKTtcbiAgICBmb3IgKGkgPSAwLCBqID0gLTE7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChvID0gc2VsZi50d2VlbltpXS52YWx1ZS5jYWxsKG5vZGUsIG5vZGUuX19kYXRhX18sIHNlbGYuaW5kZXgsIHNlbGYuZ3JvdXApKSB7XG4gICAgICAgIHR3ZWVuWysral0gPSBvO1xuICAgICAgfVxuICAgIH1cbiAgICB0d2Vlbi5sZW5ndGggPSBqICsgMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRpY2soZWxhcHNlZCkge1xuICAgIHZhciB0ID0gZWxhcHNlZCA8IHNlbGYuZHVyYXRpb24gPyBzZWxmLmVhc2UuY2FsbChudWxsLCBlbGFwc2VkIC8gc2VsZi5kdXJhdGlvbikgOiAoc2VsZi50aW1lci5yZXN0YXJ0KHN0b3ApLCBzZWxmLnN0YXRlID0gRU5ESU5HLCAxKSxcbiAgICAgICAgaSA9IC0xLFxuICAgICAgICBuID0gdHdlZW4ubGVuZ3RoO1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHR3ZWVuW2ldLmNhbGwobm9kZSwgdCk7XG4gICAgfVxuXG4gICAgLy8gRGlzcGF0Y2ggdGhlIGVuZCBldmVudC5cbiAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gRU5ESU5HKSB7XG4gICAgICBzZWxmLm9uLmNhbGwoXCJlbmRcIiwgbm9kZSwgbm9kZS5fX2RhdGFfXywgc2VsZi5pbmRleCwgc2VsZi5ncm91cCk7XG4gICAgICBzdG9wKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICBzZWxmLnN0YXRlID0gRU5ERUQ7XG4gICAgc2VsZi50aW1lci5zdG9wKCk7XG4gICAgZGVsZXRlIHNjaGVkdWxlc1tpZF07XG4gICAgZm9yICh2YXIgaSBpbiBzY2hlZHVsZXMpIHJldHVybjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICAgIGRlbGV0ZSBub2RlLl9fdHJhbnNpdGlvbjtcbiAgfVxufVxuIiwiaW1wb3J0IHtkaXNwYXRjaH0gZnJvbSBcImQzLWRpc3BhdGNoXCI7XG5pbXBvcnQge3RpbWVyLCB0aW1lb3V0fSBmcm9tIFwiZDMtdGltZXJcIjtcblxudmFyIGVtcHR5T24gPSBkaXNwYXRjaChcInN0YXJ0XCIsIFwiZW5kXCIsIFwiY2FuY2VsXCIsIFwiaW50ZXJydXB0XCIpO1xudmFyIGVtcHR5VHdlZW4gPSBbXTtcblxuZXhwb3J0IHZhciBDUkVBVEVEID0gMDtcbmV4cG9ydCB2YXIgU0NIRURVTEVEID0gMTtcbmV4cG9ydCB2YXIgU1RBUlRJTkcgPSAyO1xuZXhwb3J0IHZhciBTVEFSVEVEID0gMztcbmV4cG9ydCB2YXIgUlVOTklORyA9IDQ7XG5leHBvcnQgdmFyIEVORElORyA9IDU7XG5leHBvcnQgdmFyIEVOREVEID0gNjtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24obm9kZSwgbmFtZSwgaWQsIGluZGV4LCBncm91cCwgdGltaW5nKSB7XG4gIHZhciBzY2hlZHVsZXMgPSBub2RlLl9fdHJhbnNpdGlvbjtcbiAgaWYgKCFzY2hlZHVsZXMpIG5vZGUuX190cmFuc2l0aW9uID0ge307XG4gIGVsc2UgaWYgKGlkIGluIHNjaGVkdWxlcykgcmV0dXJuO1xuICBjcmVhdGUobm9kZSwgaWQsIHtcbiAgICBuYW1lOiBuYW1lLFxuICAgIGluZGV4OiBpbmRleCwgLy8gRm9yIGNvbnRleHQgZHVyaW5nIGNhbGxiYWNrLlxuICAgIGdyb3VwOiBncm91cCwgLy8gRm9yIGNvbnRleHQgZHVyaW5nIGNhbGxiYWNrLlxuICAgIG9uOiBlbXB0eU9uLFxuICAgIHR3ZWVuOiBlbXB0eVR3ZWVuLFxuICAgIHRpbWU6IHRpbWluZy50aW1lLFxuICAgIGRlbGF5OiB0aW1pbmcuZGVsYXksXG4gICAgZHVyYXRpb246IHRpbWluZy5kdXJhdGlvbixcbiAgICBlYXNlOiB0aW1pbmcuZWFzZSxcbiAgICB0aW1lcjogbnVsbCxcbiAgICBzdGF0ZTogQ1JFQVRFRFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluaXQobm9kZSwgaWQpIHtcbiAgdmFyIHNjaGVkdWxlID0gZ2V0KG5vZGUsIGlkKTtcbiAgaWYgKHNjaGVkdWxlLnN0YXRlID4gQ1JFQVRFRCkgdGhyb3cgbmV3IEVycm9yKFwidG9vIGxhdGU7IGFscmVhZHkgc2NoZWR1bGVkXCIpO1xuICByZXR1cm4gc2NoZWR1bGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXQobm9kZSwgaWQpIHtcbiAgdmFyIHNjaGVkdWxlID0gZ2V0KG5vZGUsIGlkKTtcbiAgaWYgKHNjaGVkdWxlLnN0YXRlID4gU1RBUlRFRCkgdGhyb3cgbmV3IEVycm9yKFwidG9vIGxhdGU7IGFscmVhZHkgcnVubmluZ1wiKTtcbiAgcmV0dXJuIHNjaGVkdWxlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0KG5vZGUsIGlkKSB7XG4gIHZhciBzY2hlZHVsZSA9IG5vZGUuX190cmFuc2l0aW9uO1xuICBpZiAoIXNjaGVkdWxlIHx8ICEoc2NoZWR1bGUgPSBzY2hlZHVsZVtpZF0pKSB0aHJvdyBuZXcgRXJyb3IoXCJ0cmFuc2l0aW9uIG5vdCBmb3VuZFwiKTtcbiAgcmV0dXJuIHNjaGVkdWxlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGUobm9kZSwgaWQsIHNlbGYpIHtcbiAgdmFyIHNjaGVkdWxlcyA9IG5vZGUuX190cmFuc2l0aW9uLFxuICAgICAgdHdlZW47XG5cbiAgLy8gSW5pdGlhbGl6ZSB0aGUgc2VsZiB0aW1lciB3aGVuIHRoZSB0cmFuc2l0aW9uIGlzIGNyZWF0ZWQuXG4gIC8vIE5vdGUgdGhlIGFjdHVhbCBkZWxheSBpcyBub3Qga25vd24gdW50aWwgdGhlIGZpcnN0IGNhbGxiYWNrIVxuICBzY2hlZHVsZXNbaWRdID0gc2VsZjtcbiAgc2VsZi50aW1lciA9IHRpbWVyKHNjaGVkdWxlLCAwLCBzZWxmLnRpbWUpO1xuXG4gIGZ1bmN0aW9uIHNjaGVkdWxlKGVsYXBzZWQpIHtcbiAgICBzZWxmLnN0YXRlID0gU0NIRURVTEVEO1xuICAgIHNlbGYudGltZXIucmVzdGFydChzdGFydCwgc2VsZi5kZWxheSwgc2VsZi50aW1lKTtcblxuICAgIC8vIElmIHRoZSBlbGFwc2VkIGRlbGF5IGlzIGxlc3MgdGhhbiBvdXIgZmlyc3Qgc2xlZXAsIHN0YXJ0IGltbWVkaWF0ZWx5LlxuICAgIGlmIChzZWxmLmRlbGF5IDw9IGVsYXBzZWQpIHN0YXJ0KGVsYXBzZWQgLSBzZWxmLmRlbGF5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGVsYXBzZWQpIHtcbiAgICB2YXIgaSwgaiwgbiwgbztcblxuICAgIC8vIElmIHRoZSBzdGF0ZSBpcyBub3QgU0NIRURVTEVELCB0aGVuIHdlIHByZXZpb3VzbHkgZXJyb3JlZCBvbiBzdGFydC5cbiAgICBpZiAoc2VsZi5zdGF0ZSAhPT0gU0NIRURVTEVEKSByZXR1cm4gc3RvcCgpO1xuXG4gICAgZm9yIChpIGluIHNjaGVkdWxlcykge1xuICAgICAgbyA9IHNjaGVkdWxlc1tpXTtcbiAgICAgIGlmIChvLm5hbWUgIT09IHNlbGYubmFtZSkgY29udGludWU7XG5cbiAgICAgIC8vIFdoaWxlIHRoaXMgZWxlbWVudCBhbHJlYWR5IGhhcyBhIHN0YXJ0aW5nIHRyYW5zaXRpb24gZHVyaW5nIHRoaXMgZnJhbWUsXG4gICAgICAvLyBkZWZlciBzdGFydGluZyBhbiBpbnRlcnJ1cHRpbmcgdHJhbnNpdGlvbiB1bnRpbCB0aGF0IHRyYW5zaXRpb24gaGFzIGFcbiAgICAgIC8vIGNoYW5jZSB0byB0aWNrIChhbmQgcG9zc2libHkgZW5kKTsgc2VlIGQzL2QzLXRyYW5zaXRpb24jNTQhXG4gICAgICBpZiAoby5zdGF0ZSA9PT0gU1RBUlRFRCkgcmV0dXJuIHRpbWVvdXQoc3RhcnQpO1xuXG4gICAgICAvLyBJbnRlcnJ1cHQgdGhlIGFjdGl2ZSB0cmFuc2l0aW9uLCBpZiBhbnkuXG4gICAgICBpZiAoby5zdGF0ZSA9PT0gUlVOTklORykge1xuICAgICAgICBvLnN0YXRlID0gRU5ERUQ7XG4gICAgICAgIG8udGltZXIuc3RvcCgpO1xuICAgICAgICBvLm9uLmNhbGwoXCJpbnRlcnJ1cHRcIiwgbm9kZSwgbm9kZS5fX2RhdGFfXywgby5pbmRleCwgby5ncm91cCk7XG4gICAgICAgIGRlbGV0ZSBzY2hlZHVsZXNbaV07XG4gICAgICB9XG5cbiAgICAgIC8vIENhbmNlbCBhbnkgcHJlLWVtcHRlZCB0cmFuc2l0aW9ucy5cbiAgICAgIGVsc2UgaWYgKCtpIDwgaWQpIHtcbiAgICAgICAgby5zdGF0ZSA9IEVOREVEO1xuICAgICAgICBvLnRpbWVyLnN0b3AoKTtcbiAgICAgICAgby5vbi5jYWxsKFwiY2FuY2VsXCIsIG5vZGUsIG5vZGUuX19kYXRhX18sIG8uaW5kZXgsIG8uZ3JvdXApO1xuICAgICAgICBkZWxldGUgc2NoZWR1bGVzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERlZmVyIHRoZSBmaXJzdCB0aWNrIHRvIGVuZCBvZiB0aGUgY3VycmVudCBmcmFtZTsgc2VlIGQzL2QzIzE1NzYuXG4gICAgLy8gTm90ZSB0aGUgdHJhbnNpdGlvbiBtYXkgYmUgY2FuY2VsZWQgYWZ0ZXIgc3RhcnQgYW5kIGJlZm9yZSB0aGUgZmlyc3QgdGljayFcbiAgICAvLyBOb3RlIHRoaXMgbXVzdCBiZSBzY2hlZHVsZWQgYmVmb3JlIHRoZSBzdGFydCBldmVudDsgc2VlIGQzL2QzLXRyYW5zaXRpb24jMTYhXG4gICAgLy8gQXNzdW1pbmcgdGhpcyBpcyBzdWNjZXNzZnVsLCBzdWJzZXF1ZW50IGNhbGxiYWNrcyBnbyBzdHJhaWdodCB0byB0aWNrLlxuICAgIHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2VsZi5zdGF0ZSA9PT0gU1RBUlRFRCkge1xuICAgICAgICBzZWxmLnN0YXRlID0gUlVOTklORztcbiAgICAgICAgc2VsZi50aW1lci5yZXN0YXJ0KHRpY2ssIHNlbGYuZGVsYXksIHNlbGYudGltZSk7XG4gICAgICAgIHRpY2soZWxhcHNlZCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBEaXNwYXRjaCB0aGUgc3RhcnQgZXZlbnQuXG4gICAgLy8gTm90ZSB0aGlzIG11c3QgYmUgZG9uZSBiZWZvcmUgdGhlIHR3ZWVuIGFyZSBpbml0aWFsaXplZC5cbiAgICBzZWxmLnN0YXRlID0gU1RBUlRJTkc7XG4gICAgc2VsZi5vbi5jYWxsKFwic3RhcnRcIiwgbm9kZSwgbm9kZS5fX2RhdGFfXywgc2VsZi5pbmRleCwgc2VsZi5ncm91cCk7XG4gICAgaWYgKHNlbGYuc3RhdGUgIT09IFNUQVJUSU5HKSByZXR1cm47IC8vIGludGVycnVwdGVkXG4gICAgc2VsZi5zdGF0ZSA9IFNUQVJURUQ7XG5cbiAgICAvLyBJbml0aWFsaXplIHRoZSB0d2VlbiwgZGVsZXRpbmcgbnVsbCB0d2Vlbi5cbiAgICB0d2VlbiA9IG5ldyBBcnJheShuID0gc2VsZi50d2Vlbi5sZW5ndGgpO1xuICAgIGZvciAoaSA9IDAsIGogPSAtMTsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKG8gPSBzZWxmLnR3ZWVuW2ldLnZhbHVlLmNhbGwobm9kZSwgbm9kZS5fX2RhdGFfXywgc2VsZi5pbmRleCwgc2VsZi5ncm91cCkpIHtcbiAgICAgICAgdHdlZW5bKytqXSA9IG87XG4gICAgICB9XG4gICAgfVxuICAgIHR3ZWVuLmxlbmd0aCA9IGogKyAxO1xuICB9XG5cbiAgZnVuY3Rpb24gdGljayhlbGFwc2VkKSB7XG4gICAgdmFyIHQgPSBlbGFwc2VkIDwgc2VsZi5kdXJhdGlvbiA/IHNlbGYuZWFzZS5jYWxsKG51bGwsIGVsYXBzZWQgLyBzZWxmLmR1cmF0aW9uKSA6IChzZWxmLnRpbWVyLnJlc3RhcnQoc3RvcCksIHNlbGYuc3RhdGUgPSBFTkRJTkcsIDEpLFxuICAgICAgICBpID0gLTEsXG4gICAgICAgIG4gPSB0d2Vlbi5sZW5ndGg7XG5cbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgdHdlZW5baV0uY2FsbChub2RlLCB0KTtcbiAgICB9XG5cbiAgICAvLyBEaXNwYXRjaCB0aGUgZW5kIGV2ZW50LlxuICAgIGlmIChzZWxmLnN0YXRlID09PSBFTkRJTkcpIHtcbiAgICAgIHNlbGYub24uY2FsbChcImVuZFwiLCBub2RlLCBub2RlLl9fZGF0YV9fLCBzZWxmLmluZGV4LCBzZWxmLmdyb3VwKTtcbiAgICAgIHN0b3AoKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzdG9wKCkge1xuICAgIHNlbGYuc3RhdGUgPSBFTkRFRDtcbiAgICBzZWxmLnRpbWVyLnN0b3AoKTtcbiAgICBkZWxldGUgc2NoZWR1bGVzW2lkXTtcbiAgICBmb3IgKHZhciBpIGluIHNjaGVkdWxlcykgcmV0dXJuOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgZGVsZXRlIG5vZGUuX190cmFuc2l0aW9uO1xuICB9XG59XG4iLCIvLyBFUzYgTWFwXG52YXIgbWFwXG50cnkge1xuICBtYXAgPSBNYXBcbn0gY2F0Y2ggKF8pIHsgfVxudmFyIHNldFxuXG4vLyBFUzYgU2V0XG50cnkge1xuICBzZXQgPSBTZXRcbn0gY2F0Y2ggKF8pIHsgfVxuXG5mdW5jdGlvbiBiYXNlQ2xvbmUgKHNyYywgY2lyY3VsYXJzLCBjbG9uZXMpIHtcbiAgLy8gTnVsbC91bmRlZmluZWQvZnVuY3Rpb25zL2V0Y1xuICBpZiAoIXNyYyB8fCB0eXBlb2Ygc3JjICE9PSAnb2JqZWN0JyB8fCB0eXBlb2Ygc3JjID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHNyY1xuICB9XG5cbiAgLy8gRE9NIE5vZGVcbiAgaWYgKHNyYy5ub2RlVHlwZSAmJiAnY2xvbmVOb2RlJyBpbiBzcmMpIHtcbiAgICByZXR1cm4gc3JjLmNsb25lTm9kZSh0cnVlKVxuICB9XG5cbiAgLy8gRGF0ZVxuICBpZiAoc3JjIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgIHJldHVybiBuZXcgRGF0ZShzcmMuZ2V0VGltZSgpKVxuICB9XG5cbiAgLy8gUmVnRXhwXG4gIGlmIChzcmMgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gbmV3IFJlZ0V4cChzcmMpXG4gIH1cblxuICAvLyBBcnJheXNcbiAgaWYgKEFycmF5LmlzQXJyYXkoc3JjKSkge1xuICAgIHJldHVybiBzcmMubWFwKGNsb25lKVxuICB9XG5cbiAgLy8gRVM2IE1hcHNcbiAgaWYgKG1hcCAmJiBzcmMgaW5zdGFuY2VvZiBtYXApIHtcbiAgICByZXR1cm4gbmV3IE1hcChBcnJheS5mcm9tKHNyYy5lbnRyaWVzKCkpKVxuICB9XG5cbiAgLy8gRVM2IFNldHNcbiAgaWYgKHNldCAmJiBzcmMgaW5zdGFuY2VvZiBzZXQpIHtcbiAgICByZXR1cm4gbmV3IFNldChBcnJheS5mcm9tKHNyYy52YWx1ZXMoKSkpXG4gIH1cblxuICAvLyBPYmplY3RcbiAgaWYgKHNyYyBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgIGNpcmN1bGFycy5wdXNoKHNyYylcbiAgICB2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZShzcmMpXG4gICAgY2xvbmVzLnB1c2gob2JqKVxuICAgIGZvciAodmFyIGtleSBpbiBzcmMpIHtcbiAgICAgIHZhciBpZHggPSBjaXJjdWxhcnMuZmluZEluZGV4KGZ1bmN0aW9uIChpKSB7XG4gICAgICAgIHJldHVybiBpID09PSBzcmNba2V5XVxuICAgICAgfSlcbiAgICAgIG9ialtrZXldID0gaWR4ID4gLTEgPyBjbG9uZXNbaWR4XSA6IGJhc2VDbG9uZShzcmNba2V5XSwgY2lyY3VsYXJzLCBjbG9uZXMpXG4gICAgfVxuICAgIHJldHVybiBvYmpcbiAgfVxuXG4gIC8vID8/P1xuICByZXR1cm4gc3JjXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNsb25lIChzcmMpIHtcbiAgcmV0dXJuIGJhc2VDbG9uZShzcmMsIFtdLCBbXSlcbn1cbiIsImNvbnN0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmNvbnN0IGVycm9yVG9TdHJpbmcgPSBFcnJvci5wcm90b3R5cGUudG9TdHJpbmc7XG5jb25zdCByZWdFeHBUb1N0cmluZyA9IFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmc7XG5jb25zdCBzeW1ib2xUb1N0cmluZyA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnID8gU3ltYm9sLnByb3RvdHlwZS50b1N0cmluZyA6ICgpID0+ICcnO1xuY29uc3QgU1lNQk9MX1JFR0VYUCA9IC9eU3ltYm9sXFwoKC4qKVxcKSguKikkLztcblxuZnVuY3Rpb24gcHJpbnROdW1iZXIodmFsKSB7XG4gIGlmICh2YWwgIT0gK3ZhbCkgcmV0dXJuICdOYU4nO1xuICBjb25zdCBpc05lZ2F0aXZlWmVybyA9IHZhbCA9PT0gMCAmJiAxIC8gdmFsIDwgMDtcbiAgcmV0dXJuIGlzTmVnYXRpdmVaZXJvID8gJy0wJyA6ICcnICsgdmFsO1xufVxuXG5mdW5jdGlvbiBwcmludFNpbXBsZVZhbHVlKHZhbCwgcXVvdGVTdHJpbmdzID0gZmFsc2UpIHtcbiAgaWYgKHZhbCA9PSBudWxsIHx8IHZhbCA9PT0gdHJ1ZSB8fCB2YWwgPT09IGZhbHNlKSByZXR1cm4gJycgKyB2YWw7XG4gIGNvbnN0IHR5cGVPZiA9IHR5cGVvZiB2YWw7XG4gIGlmICh0eXBlT2YgPT09ICdudW1iZXInKSByZXR1cm4gcHJpbnROdW1iZXIodmFsKTtcbiAgaWYgKHR5cGVPZiA9PT0gJ3N0cmluZycpIHJldHVybiBxdW90ZVN0cmluZ3MgPyBgXCIke3ZhbH1cImAgOiB2YWw7XG4gIGlmICh0eXBlT2YgPT09ICdmdW5jdGlvbicpIHJldHVybiAnW0Z1bmN0aW9uICcgKyAodmFsLm5hbWUgfHwgJ2Fub255bW91cycpICsgJ10nO1xuICBpZiAodHlwZU9mID09PSAnc3ltYm9sJykgcmV0dXJuIHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsKS5yZXBsYWNlKFNZTUJPTF9SRUdFWFAsICdTeW1ib2woJDEpJyk7XG4gIGNvbnN0IHRhZyA9IHRvU3RyaW5nLmNhbGwodmFsKS5zbGljZSg4LCAtMSk7XG4gIGlmICh0YWcgPT09ICdEYXRlJykgcmV0dXJuIGlzTmFOKHZhbC5nZXRUaW1lKCkpID8gJycgKyB2YWwgOiB2YWwudG9JU09TdHJpbmcodmFsKTtcbiAgaWYgKHRhZyA9PT0gJ0Vycm9yJyB8fCB2YWwgaW5zdGFuY2VvZiBFcnJvcikgcmV0dXJuICdbJyArIGVycm9yVG9TdHJpbmcuY2FsbCh2YWwpICsgJ10nO1xuICBpZiAodGFnID09PSAnUmVnRXhwJykgcmV0dXJuIHJlZ0V4cFRvU3RyaW5nLmNhbGwodmFsKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHByaW50VmFsdWUodmFsdWUsIHF1b3RlU3RyaW5ncykge1xuICBsZXQgcmVzdWx0ID0gcHJpbnRTaW1wbGVWYWx1ZSh2YWx1ZSwgcXVvdGVTdHJpbmdzKTtcbiAgaWYgKHJlc3VsdCAhPT0gbnVsbCkgcmV0dXJuIHJlc3VsdDtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIGxldCByZXN1bHQgPSBwcmludFNpbXBsZVZhbHVlKHRoaXNba2V5XSwgcXVvdGVTdHJpbmdzKTtcbiAgICBpZiAocmVzdWx0ICE9PSBudWxsKSByZXR1cm4gcmVzdWx0O1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfSwgMik7XG59IiwiaW1wb3J0IHByaW50VmFsdWUgZnJvbSAnLi91dGlsL3ByaW50VmFsdWUnO1xuZXhwb3J0IGxldCBtaXhlZCA9IHtcbiAgZGVmYXVsdDogJyR7cGF0aH0gaXMgaW52YWxpZCcsXG4gIHJlcXVpcmVkOiAnJHtwYXRofSBpcyBhIHJlcXVpcmVkIGZpZWxkJyxcbiAgb25lT2Y6ICcke3BhdGh9IG11c3QgYmUgb25lIG9mIHRoZSBmb2xsb3dpbmcgdmFsdWVzOiAke3ZhbHVlc30nLFxuICBub3RPbmVPZjogJyR7cGF0aH0gbXVzdCBub3QgYmUgb25lIG9mIHRoZSBmb2xsb3dpbmcgdmFsdWVzOiAke3ZhbHVlc30nLFxuICBub3RUeXBlOiAoe1xuICAgIHBhdGgsXG4gICAgdHlwZSxcbiAgICB2YWx1ZSxcbiAgICBvcmlnaW5hbFZhbHVlXG4gIH0pID0+IHtcbiAgICBsZXQgaXNDYXN0ID0gb3JpZ2luYWxWYWx1ZSAhPSBudWxsICYmIG9yaWdpbmFsVmFsdWUgIT09IHZhbHVlO1xuICAgIGxldCBtc2cgPSBgJHtwYXRofSBtdXN0IGJlIGEgXFxgJHt0eXBlfVxcYCB0eXBlLCBgICsgYGJ1dCB0aGUgZmluYWwgdmFsdWUgd2FzOiBcXGAke3ByaW50VmFsdWUodmFsdWUsIHRydWUpfVxcYGAgKyAoaXNDYXN0ID8gYCAoY2FzdCBmcm9tIHRoZSB2YWx1ZSBcXGAke3ByaW50VmFsdWUob3JpZ2luYWxWYWx1ZSwgdHJ1ZSl9XFxgKS5gIDogJy4nKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xuICAgICAgbXNnICs9IGBcXG4gSWYgXCJudWxsXCIgaXMgaW50ZW5kZWQgYXMgYW4gZW1wdHkgdmFsdWUgYmUgc3VyZSB0byBtYXJrIHRoZSBzY2hlbWEgYXMgXFxgLm51bGxhYmxlKClcXGBgO1xuICAgIH1cblxuICAgIHJldHVybiBtc2c7XG4gIH0sXG4gIGRlZmluZWQ6ICcke3BhdGh9IG11c3QgYmUgZGVmaW5lZCdcbn07XG5leHBvcnQgbGV0IHN0cmluZyA9IHtcbiAgbGVuZ3RoOiAnJHtwYXRofSBtdXN0IGJlIGV4YWN0bHkgJHtsZW5ndGh9IGNoYXJhY3RlcnMnLFxuICBtaW46ICcke3BhdGh9IG11c3QgYmUgYXQgbGVhc3QgJHttaW59IGNoYXJhY3RlcnMnLFxuICBtYXg6ICcke3BhdGh9IG11c3QgYmUgYXQgbW9zdCAke21heH0gY2hhcmFjdGVycycsXG4gIG1hdGNoZXM6ICcke3BhdGh9IG11c3QgbWF0Y2ggdGhlIGZvbGxvd2luZzogXCIke3JlZ2V4fVwiJyxcbiAgZW1haWw6ICcke3BhdGh9IG11c3QgYmUgYSB2YWxpZCBlbWFpbCcsXG4gIHVybDogJyR7cGF0aH0gbXVzdCBiZSBhIHZhbGlkIFVSTCcsXG4gIHV1aWQ6ICcke3BhdGh9IG11c3QgYmUgYSB2YWxpZCBVVUlEJyxcbiAgdHJpbTogJyR7cGF0aH0gbXVzdCBiZSBhIHRyaW1tZWQgc3RyaW5nJyxcbiAgbG93ZXJjYXNlOiAnJHtwYXRofSBtdXN0IGJlIGEgbG93ZXJjYXNlIHN0cmluZycsXG4gIHVwcGVyY2FzZTogJyR7cGF0aH0gbXVzdCBiZSBhIHVwcGVyIGNhc2Ugc3RyaW5nJ1xufTtcbmV4cG9ydCBsZXQgbnVtYmVyID0ge1xuICBtaW46ICcke3BhdGh9IG11c3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvICR7bWlufScsXG4gIG1heDogJyR7cGF0aH0gbXVzdCBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gJHttYXh9JyxcbiAgbGVzc1RoYW46ICcke3BhdGh9IG11c3QgYmUgbGVzcyB0aGFuICR7bGVzc30nLFxuICBtb3JlVGhhbjogJyR7cGF0aH0gbXVzdCBiZSBncmVhdGVyIHRoYW4gJHttb3JlfScsXG4gIHBvc2l0aXZlOiAnJHtwYXRofSBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyxcbiAgbmVnYXRpdmU6ICcke3BhdGh9IG11c3QgYmUgYSBuZWdhdGl2ZSBudW1iZXInLFxuICBpbnRlZ2VyOiAnJHtwYXRofSBtdXN0IGJlIGFuIGludGVnZXInXG59O1xuZXhwb3J0IGxldCBkYXRlID0ge1xuICBtaW46ICcke3BhdGh9IGZpZWxkIG11c3QgYmUgbGF0ZXIgdGhhbiAke21pbn0nLFxuICBtYXg6ICcke3BhdGh9IGZpZWxkIG11c3QgYmUgYXQgZWFybGllciB0aGFuICR7bWF4fSdcbn07XG5leHBvcnQgbGV0IGJvb2xlYW4gPSB7XG4gIGlzVmFsdWU6ICcke3BhdGh9IGZpZWxkIG11c3QgYmUgJHt2YWx1ZX0nXG59O1xuZXhwb3J0IGxldCBvYmplY3QgPSB7XG4gIG5vVW5rbm93bjogJyR7cGF0aH0gZmllbGQgaGFzIHVuc3BlY2lmaWVkIGtleXM6ICR7dW5rbm93bn0nXG59O1xuZXhwb3J0IGxldCBhcnJheSA9IHtcbiAgbWluOiAnJHtwYXRofSBmaWVsZCBtdXN0IGhhdmUgYXQgbGVhc3QgJHttaW59IGl0ZW1zJyxcbiAgbWF4OiAnJHtwYXRofSBmaWVsZCBtdXN0IGhhdmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvICR7bWF4fSBpdGVtcycsXG4gIGxlbmd0aDogJyR7cGF0aH0gbXVzdCBiZSBoYXZlICR7bGVuZ3RofSBpdGVtcydcbn07XG5leHBvcnQgZGVmYXVsdCBPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIHtcbiAgbWl4ZWQsXG4gIHN0cmluZyxcbiAgbnVtYmVyLFxuICBkYXRlLFxuICBvYmplY3QsXG4gIGFycmF5LFxuICBib29sZWFuXG59KTsiLCIvKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmhhc2Agd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBrZXkgVGhlIGtleSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUhhcyhvYmplY3QsIGtleSkge1xuICByZXR1cm4gb2JqZWN0ICE9IG51bGwgJiYgaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUhhcztcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhbiBgQXJyYXlgIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheSgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXk7XG4iLCIvKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbCAmJiBnbG9iYWwuT2JqZWN0ID09PSBPYmplY3QgJiYgZ2xvYmFsO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZyZWVHbG9iYWw7XG4iLCJ2YXIgZnJlZUdsb2JhbCA9IHJlcXVpcmUoJy4vX2ZyZWVHbG9iYWwnKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJvb3Q7XG4iLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbm1vZHVsZS5leHBvcnRzID0gU3ltYm9sO1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgbmF0aXZlT2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlR2V0VGFnYCB3aGljaCBpZ25vcmVzIGBTeW1ib2wudG9TdHJpbmdUYWdgIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSByYXcgYHRvU3RyaW5nVGFnYC5cbiAqL1xuZnVuY3Rpb24gZ2V0UmF3VGFnKHZhbHVlKSB7XG4gIHZhciBpc093biA9IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIHN5bVRvU3RyaW5nVGFnKSxcbiAgICAgIHRhZyA9IHZhbHVlW3N5bVRvU3RyaW5nVGFnXTtcblxuICB0cnkge1xuICAgIHZhbHVlW3N5bVRvU3RyaW5nVGFnXSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgdW5tYXNrZWQgPSB0cnVlO1xuICB9IGNhdGNoIChlKSB7fVxuXG4gIHZhciByZXN1bHQgPSBuYXRpdmVPYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgaWYgKHVubWFza2VkKSB7XG4gICAgaWYgKGlzT3duKSB7XG4gICAgICB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ10gPSB0YWc7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSB2YWx1ZVtzeW1Ub1N0cmluZ1RhZ107XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0UmF3VGFnO1xuIiwiLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqXG4gKiBVc2VkIHRvIHJlc29sdmUgdGhlXG4gKiBbYHRvU3RyaW5nVGFnYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LnByb3RvdHlwZS50b3N0cmluZylcbiAqIG9mIHZhbHVlcy5cbiAqL1xudmFyIG5hdGl2ZU9iamVjdFRvU3RyaW5nID0gb2JqZWN0UHJvdG8udG9TdHJpbmc7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyB1c2luZyBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgc3RyaW5nLlxuICovXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gbmF0aXZlT2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gb2JqZWN0VG9TdHJpbmc7XG4iLCJ2YXIgU3ltYm9sID0gcmVxdWlyZSgnLi9fU3ltYm9sJyksXG4gICAgZ2V0UmF3VGFnID0gcmVxdWlyZSgnLi9fZ2V0UmF3VGFnJyksXG4gICAgb2JqZWN0VG9TdHJpbmcgPSByZXF1aXJlKCcuL19vYmplY3RUb1N0cmluZycpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgbnVsbFRhZyA9ICdbb2JqZWN0IE51bGxdJyxcbiAgICB1bmRlZmluZWRUYWcgPSAnW29iamVjdCBVbmRlZmluZWRdJztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3ltVG9TdHJpbmdUYWcgPSBTeW1ib2wgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGdldFRhZ2Agd2l0aG91dCBmYWxsYmFja3MgZm9yIGJ1Z2d5IGVudmlyb25tZW50cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBgdG9TdHJpbmdUYWdgLlxuICovXG5mdW5jdGlvbiBiYXNlR2V0VGFnKHZhbHVlKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWRUYWcgOiBudWxsVGFnO1xuICB9XG4gIHJldHVybiAoc3ltVG9TdHJpbmdUYWcgJiYgc3ltVG9TdHJpbmdUYWcgaW4gT2JqZWN0KHZhbHVlKSlcbiAgICA/IGdldFJhd1RhZyh2YWx1ZSlcbiAgICA6IG9iamVjdFRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0VGFnO1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3RMaWtlO1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzU3ltYm9sO1xuIiwidmFyIGlzQXJyYXkgPSByZXF1aXJlKCcuL2lzQXJyYXknKSxcbiAgICBpc1N5bWJvbCA9IHJlcXVpcmUoJy4vaXNTeW1ib2wnKTtcblxuLyoqIFVzZWQgdG8gbWF0Y2ggcHJvcGVydHkgbmFtZXMgd2l0aGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHJlSXNEZWVwUHJvcCA9IC9cXC58XFxbKD86W15bXFxdXSp8KFtcIiddKSg/Oig/IVxcMSlbXlxcXFxdfFxcXFwuKSo/XFwxKVxcXS8sXG4gICAgcmVJc1BsYWluUHJvcCA9IC9eXFx3KiQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgcHJvcGVydHkgbmFtZSBhbmQgbm90IGEgcHJvcGVydHkgcGF0aC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeSBrZXlzIG9uLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSBwcm9wZXJ0eSBuYW1lLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5KHZhbHVlLCBvYmplY3QpIHtcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICBpZiAodHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdzeW1ib2wnIHx8IHR5cGUgPT0gJ2Jvb2xlYW4nIHx8XG4gICAgICB2YWx1ZSA9PSBudWxsIHx8IGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiByZUlzUGxhaW5Qcm9wLnRlc3QodmFsdWUpIHx8ICFyZUlzRGVlcFByb3AudGVzdCh2YWx1ZSkgfHxcbiAgICAob2JqZWN0ICE9IG51bGwgJiYgdmFsdWUgaW4gT2JqZWN0KG9iamVjdCkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzS2V5O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNPYmplY3Q7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBpc09iamVjdCA9IHJlcXVpcmUoJy4vaXNPYmplY3QnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFzeW5jVGFnID0gJ1tvYmplY3QgQXN5bmNGdW5jdGlvbl0nLFxuICAgIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXScsXG4gICAgcHJveHlUYWcgPSAnW29iamVjdCBQcm94eV0nO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGZ1bmN0aW9uLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDkgd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXlzIGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gIHZhciB0YWcgPSBiYXNlR2V0VGFnKHZhbHVlKTtcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWcgfHwgdGFnID09IGFzeW5jVGFnIHx8IHRhZyA9PSBwcm94eVRhZztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0Z1bmN0aW9uO1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBvdmVycmVhY2hpbmcgY29yZS1qcyBzaGltcy4gKi9cbnZhciBjb3JlSnNEYXRhID0gcm9vdFsnX19jb3JlLWpzX3NoYXJlZF9fJ107XG5cbm1vZHVsZS5leHBvcnRzID0gY29yZUpzRGF0YTtcbiIsInZhciBjb3JlSnNEYXRhID0gcmVxdWlyZSgnLi9fY29yZUpzRGF0YScpO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgbWV0aG9kcyBtYXNxdWVyYWRpbmcgYXMgbmF0aXZlLiAqL1xudmFyIG1hc2tTcmNLZXkgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciB1aWQgPSAvW14uXSskLy5leGVjKGNvcmVKc0RhdGEgJiYgY29yZUpzRGF0YS5rZXlzICYmIGNvcmVKc0RhdGEua2V5cy5JRV9QUk9UTyB8fCAnJyk7XG4gIHJldHVybiB1aWQgPyAoJ1N5bWJvbChzcmMpXzEuJyArIHVpZCkgOiAnJztcbn0oKSk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGBmdW5jYCBoYXMgaXRzIHNvdXJjZSBtYXNrZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBmdW5jYCBpcyBtYXNrZWQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNNYXNrZWQoZnVuYykge1xuICByZXR1cm4gISFtYXNrU3JjS2V5ICYmIChtYXNrU3JjS2V5IGluIGZ1bmMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTWFza2VkO1xuIiwiLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gcmVzb2x2ZSB0aGUgZGVjb21waWxlZCBzb3VyY2Ugb2YgZnVuY3Rpb25zLiAqL1xudmFyIGZ1bmNUb1N0cmluZyA9IGZ1bmNQcm90by50b1N0cmluZztcblxuLyoqXG4gKiBDb252ZXJ0cyBgZnVuY2AgdG8gaXRzIHNvdXJjZSBjb2RlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgc291cmNlIGNvZGUuXG4gKi9cbmZ1bmN0aW9uIHRvU291cmNlKGZ1bmMpIHtcbiAgaWYgKGZ1bmMgIT0gbnVsbCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZnVuY1RvU3RyaW5nLmNhbGwoZnVuYyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIChmdW5jICsgJycpO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cbiAgcmV0dXJuICcnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvU291cmNlO1xuIiwidmFyIGlzRnVuY3Rpb24gPSByZXF1aXJlKCcuL2lzRnVuY3Rpb24nKSxcbiAgICBpc01hc2tlZCA9IHJlcXVpcmUoJy4vX2lzTWFza2VkJyksXG4gICAgaXNPYmplY3QgPSByZXF1aXJlKCcuL2lzT2JqZWN0JyksXG4gICAgdG9Tb3VyY2UgPSByZXF1aXJlKCcuL190b1NvdXJjZScpO1xuXG4vKipcbiAqIFVzZWQgdG8gbWF0Y2ggYFJlZ0V4cGBcbiAqIFtzeW50YXggY2hhcmFjdGVyc10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtcGF0dGVybnMpLlxuICovXG52YXIgcmVSZWdFeHBDaGFyID0gL1tcXFxcXiQuKis/KClbXFxde318XS9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSkuICovXG52YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNQcm90byA9IEZ1bmN0aW9uLnByb3RvdHlwZSxcbiAgICBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbnZhciBmdW5jVG9TdHJpbmcgPSBmdW5jUHJvdG8udG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBpZiBhIG1ldGhvZCBpcyBuYXRpdmUuICovXG52YXIgcmVJc05hdGl2ZSA9IFJlZ0V4cCgnXicgK1xuICBmdW5jVG9TdHJpbmcuY2FsbChoYXNPd25Qcm9wZXJ0eSkucmVwbGFjZShyZVJlZ0V4cENoYXIsICdcXFxcJCYnKVxuICAucmVwbGFjZSgvaGFzT3duUHJvcGVydHl8KGZ1bmN0aW9uKS4qPyg/PVxcXFxcXCgpfCBmb3IgLis/KD89XFxcXFxcXSkvZywgJyQxLio/JykgKyAnJCdcbik7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNOYXRpdmVgIHdpdGhvdXQgYmFkIHNoaW0gY2hlY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUlzTmF0aXZlKHZhbHVlKSB7XG4gIGlmICghaXNPYmplY3QodmFsdWUpIHx8IGlzTWFza2VkKHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgcGF0dGVybiA9IGlzRnVuY3Rpb24odmFsdWUpID8gcmVJc05hdGl2ZSA6IHJlSXNIb3N0Q3RvcjtcbiAgcmV0dXJuIHBhdHRlcm4udGVzdCh0b1NvdXJjZSh2YWx1ZSkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc05hdGl2ZTtcbiIsIi8qKlxuICogR2V0cyB0aGUgdmFsdWUgYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgcHJvcGVydHkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGdldFZhbHVlKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGdldFZhbHVlO1xuIiwidmFyIGJhc2VJc05hdGl2ZSA9IHJlcXVpcmUoJy4vX2Jhc2VJc05hdGl2ZScpLFxuICAgIGdldFZhbHVlID0gcmVxdWlyZSgnLi9fZ2V0VmFsdWUnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IGdldFZhbHVlKG9iamVjdCwga2V5KTtcbiAgcmV0dXJuIGJhc2VJc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXROYXRpdmU7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9fZ2V0TmF0aXZlJyk7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbnZhciBuYXRpdmVDcmVhdGUgPSBnZXROYXRpdmUoT2JqZWN0LCAnY3JlYXRlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gbmF0aXZlQ3JlYXRlO1xuIiwidmFyIG5hdGl2ZUNyZWF0ZSA9IHJlcXVpcmUoJy4vX25hdGl2ZUNyZWF0ZScpO1xuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIGhhc2guXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGNsZWFyXG4gKiBAbWVtYmVyT2YgSGFzaFxuICovXG5mdW5jdGlvbiBoYXNoQ2xlYXIoKSB7XG4gIHRoaXMuX19kYXRhX18gPSBuYXRpdmVDcmVhdGUgPyBuYXRpdmVDcmVhdGUobnVsbCkgOiB7fTtcbiAgdGhpcy5zaXplID0gMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoYXNoQ2xlYXI7XG4iLCIvKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBoYXNoLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBkZWxldGVcbiAqIEBtZW1iZXJPZiBIYXNoXG4gKiBAcGFyYW0ge09iamVjdH0gaGFzaCBUaGUgaGFzaCB0byBtb2RpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaGFzaERlbGV0ZShrZXkpIHtcbiAgdmFyIHJlc3VsdCA9IHRoaXMuaGFzKGtleSkgJiYgZGVsZXRlIHRoaXMuX19kYXRhX19ba2V5XTtcbiAgdGhpcy5zaXplIC09IHJlc3VsdCA/IDEgOiAwO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhhc2hEZWxldGU7XG4iLCJ2YXIgbmF0aXZlQ3JlYXRlID0gcmVxdWlyZSgnLi9fbmF0aXZlQ3JlYXRlJyk7XG5cbi8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbnZhciBIQVNIX1VOREVGSU5FRCA9ICdfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBHZXRzIHRoZSBoYXNoIHZhbHVlIGZvciBga2V5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgZ2V0XG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGhhc2hHZXQoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgaWYgKG5hdGl2ZUNyZWF0ZSkge1xuICAgIHZhciByZXN1bHQgPSBkYXRhW2tleV07XG4gICAgcmV0dXJuIHJlc3VsdCA9PT0gSEFTSF9VTkRFRklORUQgPyB1bmRlZmluZWQgOiByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIGhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSA/IGRhdGFba2V5XSA6IHVuZGVmaW5lZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoYXNoR2V0O1xuIiwidmFyIG5hdGl2ZUNyZWF0ZSA9IHJlcXVpcmUoJy4vX25hdGl2ZUNyZWF0ZScpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIENoZWNrcyBpZiBhIGhhc2ggdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgaGFzXG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGhhc2hIYXMoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgcmV0dXJuIG5hdGl2ZUNyZWF0ZSA/IChkYXRhW2tleV0gIT09IHVuZGVmaW5lZCkgOiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGFzaEhhcztcbiIsInZhciBuYXRpdmVDcmVhdGUgPSByZXF1aXJlKCcuL19uYXRpdmVDcmVhdGUnKTtcblxuLyoqIFVzZWQgdG8gc3RhbmQtaW4gZm9yIGB1bmRlZmluZWRgIGhhc2ggdmFsdWVzLiAqL1xudmFyIEhBU0hfVU5ERUZJTkVEID0gJ19fbG9kYXNoX2hhc2hfdW5kZWZpbmVkX18nO1xuXG4vKipcbiAqIFNldHMgdGhlIGhhc2ggYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBoYXNoIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBoYXNoU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICB0aGlzLnNpemUgKz0gdGhpcy5oYXMoa2V5KSA/IDAgOiAxO1xuICBkYXRhW2tleV0gPSAobmF0aXZlQ3JlYXRlICYmIHZhbHVlID09PSB1bmRlZmluZWQpID8gSEFTSF9VTkRFRklORUQgOiB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGFzaFNldDtcbiIsInZhciBoYXNoQ2xlYXIgPSByZXF1aXJlKCcuL19oYXNoQ2xlYXInKSxcbiAgICBoYXNoRGVsZXRlID0gcmVxdWlyZSgnLi9faGFzaERlbGV0ZScpLFxuICAgIGhhc2hHZXQgPSByZXF1aXJlKCcuL19oYXNoR2V0JyksXG4gICAgaGFzaEhhcyA9IHJlcXVpcmUoJy4vX2hhc2hIYXMnKSxcbiAgICBoYXNoU2V0ID0gcmVxdWlyZSgnLi9faGFzaFNldCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBoYXNoIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0FycmF5fSBbZW50cmllc10gVGhlIGtleS12YWx1ZSBwYWlycyB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gSGFzaChlbnRyaWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW50cmllcyA9PSBudWxsID8gMCA6IGVudHJpZXMubGVuZ3RoO1xuXG4gIHRoaXMuY2xlYXIoKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgZW50cnkgPSBlbnRyaWVzW2luZGV4XTtcbiAgICB0aGlzLnNldChlbnRyeVswXSwgZW50cnlbMV0pO1xuICB9XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBIYXNoYC5cbkhhc2gucHJvdG90eXBlLmNsZWFyID0gaGFzaENsZWFyO1xuSGFzaC5wcm90b3R5cGVbJ2RlbGV0ZSddID0gaGFzaERlbGV0ZTtcbkhhc2gucHJvdG90eXBlLmdldCA9IGhhc2hHZXQ7XG5IYXNoLnByb3RvdHlwZS5oYXMgPSBoYXNoSGFzO1xuSGFzaC5wcm90b3R5cGUuc2V0ID0gaGFzaFNldDtcblxubW9kdWxlLmV4cG9ydHMgPSBIYXNoO1xuIiwiLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBsaXN0IGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBjbGVhclxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVDbGVhcigpIHtcbiAgdGhpcy5fX2RhdGFfXyA9IFtdO1xuICB0aGlzLnNpemUgPSAwO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3RDYWNoZUNsZWFyO1xuIiwiLyoqXG4gKiBQZXJmb3JtcyBhXG4gKiBbYFNhbWVWYWx1ZVplcm9gXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1zYW1ldmFsdWV6ZXJvKVxuICogY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB2YWx1ZXMgdG8gZGV0ZXJtaW5lIGlmIHRoZXkgYXJlIGVxdWl2YWxlbnQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0geyp9IG90aGVyIFRoZSBvdGhlciB2YWx1ZSB0byBjb21wYXJlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ2EnOiAxIH07XG4gKiB2YXIgb3RoZXIgPSB7ICdhJzogMSB9O1xuICpcbiAqIF8uZXEob2JqZWN0LCBvYmplY3QpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uZXEob2JqZWN0LCBvdGhlcik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uZXEoJ2EnLCAnYScpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uZXEoJ2EnLCBPYmplY3QoJ2EnKSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uZXEoTmFOLCBOYU4pO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBlcSh2YWx1ZSwgb3RoZXIpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBvdGhlciB8fCAodmFsdWUgIT09IHZhbHVlICYmIG90aGVyICE9PSBvdGhlcik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXE7XG4iLCJ2YXIgZXEgPSByZXF1aXJlKCcuL2VxJyk7XG5cbi8qKlxuICogR2V0cyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGBrZXlgIGlzIGZvdW5kIGluIGBhcnJheWAgb2Yga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gaW5zcGVjdC5cbiAqIEBwYXJhbSB7Kn0ga2V5IFRoZSBrZXkgdG8gc2VhcmNoIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgdGhlIGluZGV4IG9mIHRoZSBtYXRjaGVkIHZhbHVlLCBlbHNlIGAtMWAuXG4gKi9cbmZ1bmN0aW9uIGFzc29jSW5kZXhPZihhcnJheSwga2V5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIGlmIChlcShhcnJheVtsZW5ndGhdWzBdLCBrZXkpKSB7XG4gICAgICByZXR1cm4gbGVuZ3RoO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXNzb2NJbmRleE9mO1xuIiwidmFyIGFzc29jSW5kZXhPZiA9IHJlcXVpcmUoJy4vX2Fzc29jSW5kZXhPZicpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgYXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgc3BsaWNlID0gYXJyYXlQcm90by5zcGxpY2U7XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGxpc3QgY2FjaGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZW1vdmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZURlbGV0ZShrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fLFxuICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcblxuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBsYXN0SW5kZXggPSBkYXRhLmxlbmd0aCAtIDE7XG4gIGlmIChpbmRleCA9PSBsYXN0SW5kZXgpIHtcbiAgICBkYXRhLnBvcCgpO1xuICB9IGVsc2Uge1xuICAgIHNwbGljZS5jYWxsKGRhdGEsIGluZGV4LCAxKTtcbiAgfVxuICAtLXRoaXMuc2l6ZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGlzdENhY2hlRGVsZXRlO1xuIiwidmFyIGFzc29jSW5kZXhPZiA9IHJlcXVpcmUoJy4vX2Fzc29jSW5kZXhPZicpO1xuXG4vKipcbiAqIEdldHMgdGhlIGxpc3QgY2FjaGUgdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBnZXRcbiAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGVudHJ5IHZhbHVlLlxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVHZXQoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIGluZGV4ID0gYXNzb2NJbmRleE9mKGRhdGEsIGtleSk7XG5cbiAgcmV0dXJuIGluZGV4IDwgMCA/IHVuZGVmaW5lZCA6IGRhdGFbaW5kZXhdWzFdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGxpc3RDYWNoZUdldDtcbiIsInZhciBhc3NvY0luZGV4T2YgPSByZXF1aXJlKCcuL19hc3NvY0luZGV4T2YnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYSBsaXN0IGNhY2hlIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGhhc1xuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZUhhcyhrZXkpIHtcbiAgcmV0dXJuIGFzc29jSW5kZXhPZih0aGlzLl9fZGF0YV9fLCBrZXkpID4gLTE7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGlzdENhY2hlSGFzO1xuIiwidmFyIGFzc29jSW5kZXhPZiA9IHJlcXVpcmUoJy4vX2Fzc29jSW5kZXhPZicpO1xuXG4vKipcbiAqIFNldHMgdGhlIGxpc3QgY2FjaGUgYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgTGlzdENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGxpc3QgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZVNldChrZXksIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIGluZGV4ID0gYXNzb2NJbmRleE9mKGRhdGEsIGtleSk7XG5cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgICsrdGhpcy5zaXplO1xuICAgIGRhdGEucHVzaChba2V5LCB2YWx1ZV0pO1xuICB9IGVsc2Uge1xuICAgIGRhdGFbaW5kZXhdWzFdID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbGlzdENhY2hlU2V0O1xuIiwidmFyIGxpc3RDYWNoZUNsZWFyID0gcmVxdWlyZSgnLi9fbGlzdENhY2hlQ2xlYXInKSxcbiAgICBsaXN0Q2FjaGVEZWxldGUgPSByZXF1aXJlKCcuL19saXN0Q2FjaGVEZWxldGUnKSxcbiAgICBsaXN0Q2FjaGVHZXQgPSByZXF1aXJlKCcuL19saXN0Q2FjaGVHZXQnKSxcbiAgICBsaXN0Q2FjaGVIYXMgPSByZXF1aXJlKCcuL19saXN0Q2FjaGVIYXMnKSxcbiAgICBsaXN0Q2FjaGVTZXQgPSByZXF1aXJlKCcuL19saXN0Q2FjaGVTZXQnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGxpc3QgY2FjaGUgb2JqZWN0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBMaXN0Q2FjaGUoZW50cmllcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGVudHJpZXMgPT0gbnVsbCA/IDAgOiBlbnRyaWVzLmxlbmd0aDtcblxuICB0aGlzLmNsZWFyKCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGVudHJ5ID0gZW50cmllc1tpbmRleF07XG4gICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgfVxufVxuXG4vLyBBZGQgbWV0aG9kcyB0byBgTGlzdENhY2hlYC5cbkxpc3RDYWNoZS5wcm90b3R5cGUuY2xlYXIgPSBsaXN0Q2FjaGVDbGVhcjtcbkxpc3RDYWNoZS5wcm90b3R5cGVbJ2RlbGV0ZSddID0gbGlzdENhY2hlRGVsZXRlO1xuTGlzdENhY2hlLnByb3RvdHlwZS5nZXQgPSBsaXN0Q2FjaGVHZXQ7XG5MaXN0Q2FjaGUucHJvdG90eXBlLmhhcyA9IGxpc3RDYWNoZUhhcztcbkxpc3RDYWNoZS5wcm90b3R5cGUuc2V0ID0gbGlzdENhY2hlU2V0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RDYWNoZTtcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuL19nZXROYXRpdmUnKSxcbiAgICByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB0aGF0IGFyZSB2ZXJpZmllZCB0byBiZSBuYXRpdmUuICovXG52YXIgTWFwID0gZ2V0TmF0aXZlKHJvb3QsICdNYXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXA7XG4iLCJ2YXIgSGFzaCA9IHJlcXVpcmUoJy4vX0hhc2gnKSxcbiAgICBMaXN0Q2FjaGUgPSByZXF1aXJlKCcuL19MaXN0Q2FjaGUnKSxcbiAgICBNYXAgPSByZXF1aXJlKCcuL19NYXAnKTtcblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBtYXAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGNsZWFyXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqL1xuZnVuY3Rpb24gbWFwQ2FjaGVDbGVhcigpIHtcbiAgdGhpcy5zaXplID0gMDtcbiAgdGhpcy5fX2RhdGFfXyA9IHtcbiAgICAnaGFzaCc6IG5ldyBIYXNoLFxuICAgICdtYXAnOiBuZXcgKE1hcCB8fCBMaXN0Q2FjaGUpLFxuICAgICdzdHJpbmcnOiBuZXcgSGFzaFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hcENhY2hlQ2xlYXI7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdW5pcXVlIG9iamVjdCBrZXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgc3VpdGFibGUsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNLZXlhYmxlKHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gKHR5cGUgPT0gJ3N0cmluZycgfHwgdHlwZSA9PSAnbnVtYmVyJyB8fCB0eXBlID09ICdzeW1ib2wnIHx8IHR5cGUgPT0gJ2Jvb2xlYW4nKVxuICAgID8gKHZhbHVlICE9PSAnX19wcm90b19fJylcbiAgICA6ICh2YWx1ZSA9PT0gbnVsbCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNLZXlhYmxlO1xuIiwidmFyIGlzS2V5YWJsZSA9IHJlcXVpcmUoJy4vX2lzS2V5YWJsZScpO1xuXG4vKipcbiAqIEdldHMgdGhlIGRhdGEgZm9yIGBtYXBgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gbWFwIFRoZSBtYXAgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSByZWZlcmVuY2Uga2V5LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIG1hcCBkYXRhLlxuICovXG5mdW5jdGlvbiBnZXRNYXBEYXRhKG1hcCwga2V5KSB7XG4gIHZhciBkYXRhID0gbWFwLl9fZGF0YV9fO1xuICByZXR1cm4gaXNLZXlhYmxlKGtleSlcbiAgICA/IGRhdGFbdHlwZW9mIGtleSA9PSAnc3RyaW5nJyA/ICdzdHJpbmcnIDogJ2hhc2gnXVxuICAgIDogZGF0YS5tYXA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TWFwRGF0YTtcbiIsInZhciBnZXRNYXBEYXRhID0gcmVxdWlyZSgnLi9fZ2V0TWFwRGF0YScpO1xuXG4vKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBtYXAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gbWFwQ2FjaGVEZWxldGUoa2V5KSB7XG4gIHZhciByZXN1bHQgPSBnZXRNYXBEYXRhKHRoaXMsIGtleSlbJ2RlbGV0ZSddKGtleSk7XG4gIHRoaXMuc2l6ZSAtPSByZXN1bHQgPyAxIDogMDtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXBDYWNoZURlbGV0ZTtcbiIsInZhciBnZXRNYXBEYXRhID0gcmVxdWlyZSgnLi9fZ2V0TWFwRGF0YScpO1xuXG4vKipcbiAqIEdldHMgdGhlIG1hcCB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwQ2FjaGVHZXQoa2V5KSB7XG4gIHJldHVybiBnZXRNYXBEYXRhKHRoaXMsIGtleSkuZ2V0KGtleSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFwQ2FjaGVHZXQ7XG4iLCJ2YXIgZ2V0TWFwRGF0YSA9IHJlcXVpcmUoJy4vX2dldE1hcERhdGEnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYSBtYXAgdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgaGFzXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBtYXBDYWNoZUhhcyhrZXkpIHtcbiAgcmV0dXJuIGdldE1hcERhdGEodGhpcywga2V5KS5oYXMoa2V5KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXBDYWNoZUhhcztcbiIsInZhciBnZXRNYXBEYXRhID0gcmVxdWlyZSgnLi9fZ2V0TWFwRGF0YScpO1xuXG4vKipcbiAqIFNldHMgdGhlIG1hcCBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBzZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtYXAgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSBnZXRNYXBEYXRhKHRoaXMsIGtleSksXG4gICAgICBzaXplID0gZGF0YS5zaXplO1xuXG4gIGRhdGEuc2V0KGtleSwgdmFsdWUpO1xuICB0aGlzLnNpemUgKz0gZGF0YS5zaXplID09IHNpemUgPyAwIDogMTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFwQ2FjaGVTZXQ7XG4iLCJ2YXIgbWFwQ2FjaGVDbGVhciA9IHJlcXVpcmUoJy4vX21hcENhY2hlQ2xlYXInKSxcbiAgICBtYXBDYWNoZURlbGV0ZSA9IHJlcXVpcmUoJy4vX21hcENhY2hlRGVsZXRlJyksXG4gICAgbWFwQ2FjaGVHZXQgPSByZXF1aXJlKCcuL19tYXBDYWNoZUdldCcpLFxuICAgIG1hcENhY2hlSGFzID0gcmVxdWlyZSgnLi9fbWFwQ2FjaGVIYXMnKSxcbiAgICBtYXBDYWNoZVNldCA9IHJlcXVpcmUoJy4vX21hcENhY2hlU2V0Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcCBjYWNoZSBvYmplY3QgdG8gc3RvcmUga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBNYXBDYWNoZShlbnRyaWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW50cmllcyA9PSBudWxsID8gMCA6IGVudHJpZXMubGVuZ3RoO1xuXG4gIHRoaXMuY2xlYXIoKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgZW50cnkgPSBlbnRyaWVzW2luZGV4XTtcbiAgICB0aGlzLnNldChlbnRyeVswXSwgZW50cnlbMV0pO1xuICB9XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBNYXBDYWNoZWAuXG5NYXBDYWNoZS5wcm90b3R5cGUuY2xlYXIgPSBtYXBDYWNoZUNsZWFyO1xuTWFwQ2FjaGUucHJvdG90eXBlWydkZWxldGUnXSA9IG1hcENhY2hlRGVsZXRlO1xuTWFwQ2FjaGUucHJvdG90eXBlLmdldCA9IG1hcENhY2hlR2V0O1xuTWFwQ2FjaGUucHJvdG90eXBlLmhhcyA9IG1hcENhY2hlSGFzO1xuTWFwQ2FjaGUucHJvdG90eXBlLnNldCA9IG1hcENhY2hlU2V0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcENhY2hlO1xuIiwidmFyIE1hcENhY2hlID0gcmVxdWlyZSgnLi9fTWFwQ2FjaGUnKTtcblxuLyoqIEVycm9yIG1lc3NhZ2UgY29uc3RhbnRzLiAqL1xudmFyIEZVTkNfRVJST1JfVEVYVCA9ICdFeHBlY3RlZCBhIGZ1bmN0aW9uJztcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gdGhhdCBtZW1vaXplcyB0aGUgcmVzdWx0IG9mIGBmdW5jYC4gSWYgYHJlc29sdmVyYCBpc1xuICogcHJvdmlkZWQsIGl0IGRldGVybWluZXMgdGhlIGNhY2hlIGtleSBmb3Igc3RvcmluZyB0aGUgcmVzdWx0IGJhc2VkIG9uIHRoZVxuICogYXJndW1lbnRzIHByb3ZpZGVkIHRvIHRoZSBtZW1vaXplZCBmdW5jdGlvbi4gQnkgZGVmYXVsdCwgdGhlIGZpcnN0IGFyZ3VtZW50XG4gKiBwcm92aWRlZCB0byB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24gaXMgdXNlZCBhcyB0aGUgbWFwIGNhY2hlIGtleS4gVGhlIGBmdW5jYFxuICogaXMgaW52b2tlZCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24uXG4gKlxuICogKipOb3RlOioqIFRoZSBjYWNoZSBpcyBleHBvc2VkIGFzIHRoZSBgY2FjaGVgIHByb3BlcnR5IG9uIHRoZSBtZW1vaXplZFxuICogZnVuY3Rpb24uIEl0cyBjcmVhdGlvbiBtYXkgYmUgY3VzdG9taXplZCBieSByZXBsYWNpbmcgdGhlIGBfLm1lbW9pemUuQ2FjaGVgXG4gKiBjb25zdHJ1Y3RvciB3aXRoIG9uZSB3aG9zZSBpbnN0YW5jZXMgaW1wbGVtZW50IHRoZVxuICogW2BNYXBgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1wcm9wZXJ0aWVzLW9mLXRoZS1tYXAtcHJvdG90eXBlLW9iamVjdClcbiAqIG1ldGhvZCBpbnRlcmZhY2Ugb2YgYGNsZWFyYCwgYGRlbGV0ZWAsIGBnZXRgLCBgaGFzYCwgYW5kIGBzZXRgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBUaGUgZnVuY3Rpb24gdG8gaGF2ZSBpdHMgb3V0cHV0IG1lbW9pemVkLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gW3Jlc29sdmVyXSBUaGUgZnVuY3Rpb24gdG8gcmVzb2x2ZSB0aGUgY2FjaGUga2V5LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgbWVtb2l6ZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICdhJzogMSwgJ2InOiAyIH07XG4gKiB2YXIgb3RoZXIgPSB7ICdjJzogMywgJ2QnOiA0IH07XG4gKlxuICogdmFyIHZhbHVlcyA9IF8ubWVtb2l6ZShfLnZhbHVlcyk7XG4gKiB2YWx1ZXMob2JqZWN0KTtcbiAqIC8vID0+IFsxLCAyXVxuICpcbiAqIHZhbHVlcyhvdGhlcik7XG4gKiAvLyA9PiBbMywgNF1cbiAqXG4gKiBvYmplY3QuYSA9IDI7XG4gKiB2YWx1ZXMob2JqZWN0KTtcbiAqIC8vID0+IFsxLCAyXVxuICpcbiAqIC8vIE1vZGlmeSB0aGUgcmVzdWx0IGNhY2hlLlxuICogdmFsdWVzLmNhY2hlLnNldChvYmplY3QsIFsnYScsICdiJ10pO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbJ2EnLCAnYiddXG4gKlxuICogLy8gUmVwbGFjZSBgXy5tZW1vaXplLkNhY2hlYC5cbiAqIF8ubWVtb2l6ZS5DYWNoZSA9IFdlYWtNYXA7XG4gKi9cbmZ1bmN0aW9uIG1lbW9pemUoZnVuYywgcmVzb2x2ZXIpIHtcbiAgaWYgKHR5cGVvZiBmdW5jICE9ICdmdW5jdGlvbicgfHwgKHJlc29sdmVyICE9IG51bGwgJiYgdHlwZW9mIHJlc29sdmVyICE9ICdmdW5jdGlvbicpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihGVU5DX0VSUk9SX1RFWFQpO1xuICB9XG4gIHZhciBtZW1vaXplZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzID0gYXJndW1lbnRzLFxuICAgICAgICBrZXkgPSByZXNvbHZlciA/IHJlc29sdmVyLmFwcGx5KHRoaXMsIGFyZ3MpIDogYXJnc1swXSxcbiAgICAgICAgY2FjaGUgPSBtZW1vaXplZC5jYWNoZTtcblxuICAgIGlmIChjYWNoZS5oYXMoa2V5KSkge1xuICAgICAgcmV0dXJuIGNhY2hlLmdldChrZXkpO1xuICAgIH1cbiAgICB2YXIgcmVzdWx0ID0gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICBtZW1vaXplZC5jYWNoZSA9IGNhY2hlLnNldChrZXksIHJlc3VsdCkgfHwgY2FjaGU7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbiAgbWVtb2l6ZWQuY2FjaGUgPSBuZXcgKG1lbW9pemUuQ2FjaGUgfHwgTWFwQ2FjaGUpO1xuICByZXR1cm4gbWVtb2l6ZWQ7XG59XG5cbi8vIEV4cG9zZSBgTWFwQ2FjaGVgLlxubWVtb2l6ZS5DYWNoZSA9IE1hcENhY2hlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1lbW9pemU7XG4iLCJ2YXIgbWVtb2l6ZSA9IHJlcXVpcmUoJy4vbWVtb2l6ZScpO1xuXG4vKiogVXNlZCBhcyB0aGUgbWF4aW11bSBtZW1vaXplIGNhY2hlIHNpemUuICovXG52YXIgTUFYX01FTU9JWkVfU0laRSA9IDUwMDtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWVtb2l6ZWAgd2hpY2ggY2xlYXJzIHRoZSBtZW1vaXplZCBmdW5jdGlvbidzXG4gKiBjYWNoZSB3aGVuIGl0IGV4Y2VlZHMgYE1BWF9NRU1PSVpFX1NJWkVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBoYXZlIGl0cyBvdXRwdXQgbWVtb2l6ZWQuXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBtZW1vaXplZCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gbWVtb2l6ZUNhcHBlZChmdW5jKSB7XG4gIHZhciByZXN1bHQgPSBtZW1vaXplKGZ1bmMsIGZ1bmN0aW9uKGtleSkge1xuICAgIGlmIChjYWNoZS5zaXplID09PSBNQVhfTUVNT0laRV9TSVpFKSB7XG4gICAgICBjYWNoZS5jbGVhcigpO1xuICAgIH1cbiAgICByZXR1cm4ga2V5O1xuICB9KTtcblxuICB2YXIgY2FjaGUgPSByZXN1bHQuY2FjaGU7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWVtb2l6ZUNhcHBlZDtcbiIsInZhciBtZW1vaXplQ2FwcGVkID0gcmVxdWlyZSgnLi9fbWVtb2l6ZUNhcHBlZCcpO1xuXG4vKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVQcm9wTmFtZSA9IC9bXi5bXFxdXSt8XFxbKD86KC0/XFxkKyg/OlxcLlxcZCspPyl8KFtcIiddKSgoPzooPyFcXDIpW15cXFxcXXxcXFxcLikqPylcXDIpXFxdfCg/PSg/OlxcLnxcXFtcXF0pKD86XFwufFxcW1xcXXwkKSkvZztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVFc2NhcGVDaGFyID0gL1xcXFwoXFxcXCk/L2c7XG5cbi8qKlxuICogQ29udmVydHMgYHN0cmluZ2AgdG8gYSBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgcHJvcGVydHkgcGF0aCBhcnJheS5cbiAqL1xudmFyIHN0cmluZ1RvUGF0aCA9IG1lbW9pemVDYXBwZWQoZnVuY3Rpb24oc3RyaW5nKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcbiAgaWYgKHN0cmluZy5jaGFyQ29kZUF0KDApID09PSA0NiAvKiAuICovKSB7XG4gICAgcmVzdWx0LnB1c2goJycpO1xuICB9XG4gIHN0cmluZy5yZXBsYWNlKHJlUHJvcE5hbWUsIGZ1bmN0aW9uKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdWJTdHJpbmcpIHtcbiAgICByZXN1bHQucHVzaChxdW90ZSA/IHN1YlN0cmluZy5yZXBsYWNlKHJlRXNjYXBlQ2hhciwgJyQxJykgOiAobnVtYmVyIHx8IG1hdGNoKSk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gc3RyaW5nVG9QYXRoO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ubWFwYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3IgaXRlcmF0ZWVcbiAqIHNob3J0aGFuZHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheV0gVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIG5ldyBtYXBwZWQgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGFycmF5TWFwKGFycmF5LCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGFycmF5ID09IG51bGwgPyAwIDogYXJyYXkubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gQXJyYXkobGVuZ3RoKTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheU1hcDtcbiIsInZhciBTeW1ib2wgPSByZXF1aXJlKCcuL19TeW1ib2wnKSxcbiAgICBhcnJheU1hcCA9IHJlcXVpcmUoJy4vX2FycmF5TWFwJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXNBcnJheScpLFxuICAgIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwO1xuXG4vKiogVXNlZCB0byBjb252ZXJ0IHN5bWJvbHMgdG8gcHJpbWl0aXZlcyBhbmQgc3RyaW5ncy4gKi9cbnZhciBzeW1ib2xQcm90byA9IFN5bWJvbCA/IFN5bWJvbC5wcm90b3R5cGUgOiB1bmRlZmluZWQsXG4gICAgc3ltYm9sVG9TdHJpbmcgPSBzeW1ib2xQcm90byA/IHN5bWJvbFByb3RvLnRvU3RyaW5nIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnRvU3RyaW5nYCB3aGljaCBkb2Vzbid0IGNvbnZlcnQgbnVsbGlzaFxuICogdmFsdWVzIHRvIGVtcHR5IHN0cmluZ3MuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUb1N0cmluZyh2YWx1ZSkge1xuICAvLyBFeGl0IGVhcmx5IGZvciBzdHJpbmdzIHRvIGF2b2lkIGEgcGVyZm9ybWFuY2UgaGl0IGluIHNvbWUgZW52aXJvbm1lbnRzLlxuICBpZiAodHlwZW9mIHZhbHVlID09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIC8vIFJlY3Vyc2l2ZWx5IGNvbnZlcnQgdmFsdWVzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgcmV0dXJuIGFycmF5TWFwKHZhbHVlLCBiYXNlVG9TdHJpbmcpICsgJyc7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VUb1N0cmluZztcbiIsInZhciBiYXNlVG9TdHJpbmcgPSByZXF1aXJlKCcuL19iYXNlVG9TdHJpbmcnKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgdmFsdWVgIHRvIGEgc3RyaW5nLiBBbiBlbXB0eSBzdHJpbmcgaXMgcmV0dXJuZWQgZm9yIGBudWxsYFxuICogYW5kIGB1bmRlZmluZWRgIHZhbHVlcy4gVGhlIHNpZ24gb2YgYC0wYCBpcyBwcmVzZXJ2ZWQuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjb252ZXJ0ZWQgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLnRvU3RyaW5nKG51bGwpO1xuICogLy8gPT4gJydcbiAqXG4gKiBfLnRvU3RyaW5nKC0wKTtcbiAqIC8vID0+ICctMCdcbiAqXG4gKiBfLnRvU3RyaW5nKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiAnMSwyLDMnXG4gKi9cbmZ1bmN0aW9uIHRvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PSBudWxsID8gJycgOiBiYXNlVG9TdHJpbmcodmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvU3RyaW5nO1xuIiwidmFyIGlzQXJyYXkgPSByZXF1aXJlKCcuL2lzQXJyYXknKSxcbiAgICBpc0tleSA9IHJlcXVpcmUoJy4vX2lzS2V5JyksXG4gICAgc3RyaW5nVG9QYXRoID0gcmVxdWlyZSgnLi9fc3RyaW5nVG9QYXRoJyksXG4gICAgdG9TdHJpbmcgPSByZXF1aXJlKCcuL3RvU3RyaW5nJyk7XG5cbi8qKlxuICogQ2FzdHMgYHZhbHVlYCB0byBhIHBhdGggYXJyYXkgaWYgaXQncyBub3Qgb25lLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBpbnNwZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcXVlcnkga2V5cyBvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY2FzdCBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG5mdW5jdGlvbiBjYXN0UGF0aCh2YWx1ZSwgb2JqZWN0KSB7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuICByZXR1cm4gaXNLZXkodmFsdWUsIG9iamVjdCkgPyBbdmFsdWVdIDogc3RyaW5nVG9QYXRoKHRvU3RyaW5nKHZhbHVlKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FzdFBhdGg7XG4iLCJ2YXIgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzQXJndW1lbnRzYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBgYXJndW1lbnRzYCBvYmplY3QsXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0FyZ3VtZW50cyh2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBiYXNlR2V0VGFnKHZhbHVlKSA9PSBhcmdzVGFnO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0FyZ3VtZW50cztcbiIsInZhciBiYXNlSXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL19iYXNlSXNBcmd1bWVudHMnKSxcbiAgICBpc09iamVjdExpa2UgPSByZXF1aXJlKCcuL2lzT2JqZWN0TGlrZScpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGxpa2VseSBhbiBgYXJndW1lbnRzYCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gYGFyZ3VtZW50c2Agb2JqZWN0LFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0FyZ3VtZW50cyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgpKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJndW1lbnRzKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcmd1bWVudHMgPSBiYXNlSXNBcmd1bWVudHMoZnVuY3Rpb24oKSB7IHJldHVybiBhcmd1bWVudHM7IH0oKSkgPyBiYXNlSXNBcmd1bWVudHMgOiBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKHZhbHVlLCAnY2FsbGVlJykgJiZcbiAgICAhcHJvcGVydHlJc0VudW1lcmFibGUuY2FsbCh2YWx1ZSwgJ2NhbGxlZScpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpc0FyZ3VtZW50cztcbiIsIi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIE1BWF9TQUZFX0lOVEVHRVIgPSA5MDA3MTk5MjU0NzQwOTkxO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgdW5zaWduZWQgaW50ZWdlciB2YWx1ZXMuICovXG52YXIgcmVJc1VpbnQgPSAvXig/OjB8WzEtOV1cXGQqKSQvO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgdmFsaWQgYXJyYXktbGlrZSBpbmRleC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcGFyYW0ge251bWJlcn0gW2xlbmd0aD1NQVhfU0FGRV9JTlRFR0VSXSBUaGUgdXBwZXIgYm91bmRzIG9mIGEgdmFsaWQgaW5kZXguXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGluZGV4LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSW5kZXgodmFsdWUsIGxlbmd0aCkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgbGVuZ3RoID0gbGVuZ3RoID09IG51bGwgPyBNQVhfU0FGRV9JTlRFR0VSIDogbGVuZ3RoO1xuXG4gIHJldHVybiAhIWxlbmd0aCAmJlxuICAgICh0eXBlID09ICdudW1iZXInIHx8XG4gICAgICAodHlwZSAhPSAnc3ltYm9sJyAmJiByZUlzVWludC50ZXN0KHZhbHVlKSkpICYmXG4gICAgICAgICh2YWx1ZSA+IC0xICYmIHZhbHVlICUgMSA9PSAwICYmIHZhbHVlIDwgbGVuZ3RoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc0luZGV4O1xuIiwiLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgTUFYX1NBRkVfSU5URUdFUiA9IDkwMDcxOTkyNTQ3NDA5OTE7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSB2YWxpZCBhcnJheS1saWtlIGxlbmd0aC5cbiAqXG4gKiAqKk5vdGU6KiogVGhpcyBtZXRob2QgaXMgbG9vc2VseSBiYXNlZCBvblxuICogW2BUb0xlbmd0aGBdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXRvbGVuZ3RoKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHZhbGlkIGxlbmd0aCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzTGVuZ3RoKDMpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNMZW5ndGgoTnVtYmVyLk1JTl9WQUxVRSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNMZW5ndGgoSW5maW5pdHkpO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzTGVuZ3RoKCczJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0xlbmd0aCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmXG4gICAgdmFsdWUgPiAtMSAmJiB2YWx1ZSAlIDEgPT0gMCAmJiB2YWx1ZSA8PSBNQVhfU0FGRV9JTlRFR0VSO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzTGVuZ3RoO1xuIiwidmFyIGlzU3ltYm9sID0gcmVxdWlyZSgnLi9pc1N5bWJvbCcpO1xuXG4vKiogVXNlZCBhcyByZWZlcmVuY2VzIGZvciB2YXJpb3VzIGBOdW1iZXJgIGNvbnN0YW50cy4gKi9cbnZhciBJTkZJTklUWSA9IDEgLyAwO1xuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcga2V5IGlmIGl0J3Mgbm90IGEgc3RyaW5nIG9yIHN5bWJvbC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtzdHJpbmd8c3ltYm9sfSBSZXR1cm5zIHRoZSBrZXkuXG4gKi9cbmZ1bmN0aW9uIHRvS2V5KHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgfHwgaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG4gIHZhciByZXN1bHQgPSAodmFsdWUgKyAnJyk7XG4gIHJldHVybiAocmVzdWx0ID09ICcwJyAmJiAoMSAvIHZhbHVlKSA9PSAtSU5GSU5JVFkpID8gJy0wJyA6IHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB0b0tleTtcbiIsInZhciBjYXN0UGF0aCA9IHJlcXVpcmUoJy4vX2Nhc3RQYXRoJyksXG4gICAgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2lzQXJndW1lbnRzJyksXG4gICAgaXNBcnJheSA9IHJlcXVpcmUoJy4vaXNBcnJheScpLFxuICAgIGlzSW5kZXggPSByZXF1aXJlKCcuL19pc0luZGV4JyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAgdG9LZXkgPSByZXF1aXJlKCcuL190b0tleScpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgcGF0aGAgZXhpc3RzIG9uIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCB0byBjaGVjay5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGhhc0Z1bmMgVGhlIGZ1bmN0aW9uIHRvIGNoZWNrIHByb3BlcnRpZXMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHBhdGhgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBoYXNQYXRoKG9iamVjdCwgcGF0aCwgaGFzRnVuYykge1xuICBwYXRoID0gY2FzdFBhdGgocGF0aCwgb2JqZWN0KTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoLFxuICAgICAgcmVzdWx0ID0gZmFsc2U7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIga2V5ID0gdG9LZXkocGF0aFtpbmRleF0pO1xuICAgIGlmICghKHJlc3VsdCA9IG9iamVjdCAhPSBudWxsICYmIGhhc0Z1bmMob2JqZWN0LCBrZXkpKSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIG9iamVjdCA9IG9iamVjdFtrZXldO1xuICB9XG4gIGlmIChyZXN1bHQgfHwgKytpbmRleCAhPSBsZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIGxlbmd0aCA9IG9iamVjdCA9PSBudWxsID8gMCA6IG9iamVjdC5sZW5ndGg7XG4gIHJldHVybiAhIWxlbmd0aCAmJiBpc0xlbmd0aChsZW5ndGgpICYmIGlzSW5kZXgoa2V5LCBsZW5ndGgpICYmXG4gICAgKGlzQXJyYXkob2JqZWN0KSB8fCBpc0FyZ3VtZW50cyhvYmplY3QpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoYXNQYXRoO1xuIiwidmFyIGJhc2VIYXMgPSByZXF1aXJlKCcuL19iYXNlSGFzJyksXG4gICAgaGFzUGF0aCA9IHJlcXVpcmUoJy4vX2hhc1BhdGgnKTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHBhdGhgIGlzIGEgZGlyZWN0IHByb3BlcnR5IG9mIGBvYmplY3RgLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBzaW5jZSAwLjEuMFxuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBwYXRoIFRoZSBwYXRoIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGBwYXRoYCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ2EnOiB7ICdiJzogMiB9IH07XG4gKiB2YXIgb3RoZXIgPSBfLmNyZWF0ZSh7ICdhJzogXy5jcmVhdGUoeyAnYic6IDIgfSkgfSk7XG4gKlxuICogXy5oYXMob2JqZWN0LCAnYScpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaGFzKG9iamVjdCwgJ2EuYicpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaGFzKG9iamVjdCwgWydhJywgJ2InXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5oYXMob3RoZXIsICdhJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBoYXMob2JqZWN0LCBwYXRoKSB7XG4gIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiBoYXNQYXRoKG9iamVjdCwgcGF0aCwgYmFzZUhhcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGFzO1xuIiwiZXhwb3J0IGRlZmF1bHQgKG9iaiA9PiBvYmogJiYgb2JqLl9faXNZdXBTY2hlbWFfXyk7IiwiaW1wb3J0IGhhcyBmcm9tICdsb2Rhc2gvaGFzJztcbmltcG9ydCBpc1NjaGVtYSBmcm9tICcuL3V0aWwvaXNTY2hlbWEnO1xuXG5jbGFzcyBDb25kaXRpb24ge1xuICBjb25zdHJ1Y3RvcihyZWZzLCBvcHRpb25zKSB7XG4gICAgdGhpcy5yZWZzID0gcmVmcztcbiAgICB0aGlzLnJlZnMgPSByZWZzO1xuXG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLmZuID0gb3B0aW9ucztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWhhcyhvcHRpb25zLCAnaXMnKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYGlzOmAgaXMgcmVxdWlyZWQgZm9yIGB3aGVuKClgIGNvbmRpdGlvbnMnKTtcbiAgICBpZiAoIW9wdGlvbnMudGhlbiAmJiAhb3B0aW9ucy5vdGhlcndpc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VpdGhlciBgdGhlbjpgIG9yIGBvdGhlcndpc2U6YCBpcyByZXF1aXJlZCBmb3IgYHdoZW4oKWAgY29uZGl0aW9ucycpO1xuICAgIGxldCB7XG4gICAgICBpcyxcbiAgICAgIHRoZW4sXG4gICAgICBvdGhlcndpc2VcbiAgICB9ID0gb3B0aW9ucztcbiAgICBsZXQgY2hlY2sgPSB0eXBlb2YgaXMgPT09ICdmdW5jdGlvbicgPyBpcyA6ICguLi52YWx1ZXMpID0+IHZhbHVlcy5ldmVyeSh2YWx1ZSA9PiB2YWx1ZSA9PT0gaXMpO1xuXG4gICAgdGhpcy5mbiA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICBsZXQgb3B0aW9ucyA9IGFyZ3MucG9wKCk7XG4gICAgICBsZXQgc2NoZW1hID0gYXJncy5wb3AoKTtcbiAgICAgIGxldCBicmFuY2ggPSBjaGVjayguLi5hcmdzKSA/IHRoZW4gOiBvdGhlcndpc2U7XG4gICAgICBpZiAoIWJyYW5jaCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgIGlmICh0eXBlb2YgYnJhbmNoID09PSAnZnVuY3Rpb24nKSByZXR1cm4gYnJhbmNoKHNjaGVtYSk7XG4gICAgICByZXR1cm4gc2NoZW1hLmNvbmNhdChicmFuY2gucmVzb2x2ZShvcHRpb25zKSk7XG4gICAgfTtcbiAgfVxuXG4gIHJlc29sdmUoYmFzZSwgb3B0aW9ucykge1xuICAgIGxldCB2YWx1ZXMgPSB0aGlzLnJlZnMubWFwKHJlZiA9PiByZWYuZ2V0VmFsdWUob3B0aW9ucyA9PSBudWxsID8gdm9pZCAwIDogb3B0aW9ucy52YWx1ZSwgb3B0aW9ucyA9PSBudWxsID8gdm9pZCAwIDogb3B0aW9ucy5wYXJlbnQsIG9wdGlvbnMgPT0gbnVsbCA/IHZvaWQgMCA6IG9wdGlvbnMuY29udGV4dCkpO1xuICAgIGxldCBzY2hlbWEgPSB0aGlzLmZuLmFwcGx5KGJhc2UsIHZhbHVlcy5jb25jYXQoYmFzZSwgb3B0aW9ucykpO1xuICAgIGlmIChzY2hlbWEgPT09IHVuZGVmaW5lZCB8fCBzY2hlbWEgPT09IGJhc2UpIHJldHVybiBiYXNlO1xuICAgIGlmICghaXNTY2hlbWEoc2NoZW1hKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignY29uZGl0aW9ucyBtdXN0IHJldHVybiBhIHNjaGVtYSBvYmplY3QnKTtcbiAgICByZXR1cm4gc2NoZW1hLnJlc29sdmUob3B0aW9ucyk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBDb25kaXRpb247IiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdG9BcnJheSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/IFtdIDogW10uY29uY2F0KHZhbHVlKTtcbn0iLCJmdW5jdGlvbiBfZXh0ZW5kcygpIHsgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9OyByZXR1cm4gX2V4dGVuZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxuXG5pbXBvcnQgcHJpbnRWYWx1ZSBmcm9tICcuL3V0aWwvcHJpbnRWYWx1ZSc7XG5pbXBvcnQgdG9BcnJheSBmcm9tICcuL3V0aWwvdG9BcnJheSc7XG5sZXQgc3RyUmVnID0gL1xcJFxce1xccyooXFx3KylcXHMqXFx9L2c7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWYWxpZGF0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHN0YXRpYyBmb3JtYXRFcnJvcihtZXNzYWdlLCBwYXJhbXMpIHtcbiAgICBjb25zdCBwYXRoID0gcGFyYW1zLmxhYmVsIHx8IHBhcmFtcy5wYXRoIHx8ICd0aGlzJztcbiAgICBpZiAocGF0aCAhPT0gcGFyYW1zLnBhdGgpIHBhcmFtcyA9IF9leHRlbmRzKHt9LCBwYXJhbXMsIHtcbiAgICAgIHBhdGhcbiAgICB9KTtcbiAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSByZXR1cm4gbWVzc2FnZS5yZXBsYWNlKHN0clJlZywgKF8sIGtleSkgPT4gcHJpbnRWYWx1ZShwYXJhbXNba2V5XSkpO1xuICAgIGlmICh0eXBlb2YgbWVzc2FnZSA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIG1lc3NhZ2UocGFyYW1zKTtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxuXG4gIHN0YXRpYyBpc0Vycm9yKGVycikge1xuICAgIHJldHVybiBlcnIgJiYgZXJyLm5hbWUgPT09ICdWYWxpZGF0aW9uRXJyb3InO1xuICB9XG5cbiAgY29uc3RydWN0b3IoZXJyb3JPckVycm9ycywgdmFsdWUsIGZpZWxkLCB0eXBlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm5hbWUgPSAnVmFsaWRhdGlvbkVycm9yJztcbiAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5wYXRoID0gZmllbGQ7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmVycm9ycyA9IFtdO1xuICAgIHRoaXMuaW5uZXIgPSBbXTtcbiAgICB0b0FycmF5KGVycm9yT3JFcnJvcnMpLmZvckVhY2goZXJyID0+IHtcbiAgICAgIGlmIChWYWxpZGF0aW9uRXJyb3IuaXNFcnJvcihlcnIpKSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2goLi4uZXJyLmVycm9ycyk7XG4gICAgICAgIHRoaXMuaW5uZXIgPSB0aGlzLmlubmVyLmNvbmNhdChlcnIuaW5uZXIubGVuZ3RoID8gZXJyLmlubmVyIDogZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZXJyb3JzLnB1c2goZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2UgPSB0aGlzLmVycm9ycy5sZW5ndGggPiAxID8gYCR7dGhpcy5lcnJvcnMubGVuZ3RofSBlcnJvcnMgb2NjdXJyZWRgIDogdGhpcy5lcnJvcnNbMF07XG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBWYWxpZGF0aW9uRXJyb3IpO1xuICB9XG5cbn0iLCJpbXBvcnQgVmFsaWRhdGlvbkVycm9yIGZyb20gJy4uL1ZhbGlkYXRpb25FcnJvcic7XG5cbmNvbnN0IG9uY2UgPSBjYiA9PiB7XG4gIGxldCBmaXJlZCA9IGZhbHNlO1xuICByZXR1cm4gKC4uLmFyZ3MpID0+IHtcbiAgICBpZiAoZmlyZWQpIHJldHVybjtcbiAgICBmaXJlZCA9IHRydWU7XG4gICAgY2IoLi4uYXJncyk7XG4gIH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBydW5UZXN0cyhvcHRpb25zLCBjYikge1xuICBsZXQge1xuICAgIGVuZEVhcmx5LFxuICAgIHRlc3RzLFxuICAgIGFyZ3MsXG4gICAgdmFsdWUsXG4gICAgZXJyb3JzLFxuICAgIHNvcnQsXG4gICAgcGF0aFxuICB9ID0gb3B0aW9ucztcbiAgbGV0IGNhbGxiYWNrID0gb25jZShjYik7XG4gIGxldCBjb3VudCA9IHRlc3RzLmxlbmd0aDtcbiAgY29uc3QgbmVzdGVkRXJyb3JzID0gW107XG4gIGVycm9ycyA9IGVycm9ycyA/IGVycm9ycyA6IFtdO1xuICBpZiAoIWNvdW50KSByZXR1cm4gZXJyb3JzLmxlbmd0aCA/IGNhbGxiYWNrKG5ldyBWYWxpZGF0aW9uRXJyb3IoZXJyb3JzLCB2YWx1ZSwgcGF0aCkpIDogY2FsbGJhY2sobnVsbCwgdmFsdWUpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdGVzdHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB0ZXN0ID0gdGVzdHNbaV07XG4gICAgdGVzdChhcmdzLCBmdW5jdGlvbiBmaW5pc2hUZXN0UnVuKGVycikge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICAvLyBhbHdheXMgcmV0dXJuIGVhcmx5IGZvciBub24gdmFsaWRhdGlvbiBlcnJvcnNcbiAgICAgICAgaWYgKCFWYWxpZGF0aW9uRXJyb3IuaXNFcnJvcihlcnIpKSB7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVuZEVhcmx5KSB7XG4gICAgICAgICAgZXJyLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmVzdGVkRXJyb3JzLnB1c2goZXJyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKC0tY291bnQgPD0gMCkge1xuICAgICAgICBpZiAobmVzdGVkRXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIGlmIChzb3J0KSBuZXN0ZWRFcnJvcnMuc29ydChzb3J0KTsgLy9zaG93IHBhcmVudCBlcnJvcnMgYWZ0ZXIgdGhlIG5lc3RlZCBvbmVzOiBuYW1lLmZpcnN0LCBuYW1lXG5cbiAgICAgICAgICBpZiAoZXJyb3JzLmxlbmd0aCkgbmVzdGVkRXJyb3JzLnB1c2goLi4uZXJyb3JzKTtcbiAgICAgICAgICBlcnJvcnMgPSBuZXN0ZWRFcnJvcnM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICAgIGNhbGxiYWNrKG5ldyBWYWxpZGF0aW9uRXJyb3IoZXJyb3JzLCB2YWx1ZSwgcGF0aCksIHZhbHVlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjYWxsYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9fZ2V0TmF0aXZlJyk7XG5cbnZhciBkZWZpbmVQcm9wZXJ0eSA9IChmdW5jdGlvbigpIHtcbiAgdHJ5IHtcbiAgICB2YXIgZnVuYyA9IGdldE5hdGl2ZShPYmplY3QsICdkZWZpbmVQcm9wZXJ0eScpO1xuICAgIGZ1bmMoe30sICcnLCB7fSk7XG4gICAgcmV0dXJuIGZ1bmM7XG4gIH0gY2F0Y2ggKGUpIHt9XG59KCkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRlZmluZVByb3BlcnR5O1xuIiwidmFyIGRlZmluZVByb3BlcnR5ID0gcmVxdWlyZSgnLi9fZGVmaW5lUHJvcGVydHknKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgYXNzaWduVmFsdWVgIGFuZCBgYXNzaWduTWVyZ2VWYWx1ZWAgd2l0aG91dFxuICogdmFsdWUgY2hlY2tzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBwcm9wZXJ0eSB0byBhc3NpZ24uXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBhc3NpZ24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VBc3NpZ25WYWx1ZShvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgaWYgKGtleSA9PSAnX19wcm90b19fJyAmJiBkZWZpbmVQcm9wZXJ0eSkge1xuICAgIGRlZmluZVByb3BlcnR5KG9iamVjdCwga2V5LCB7XG4gICAgICAnY29uZmlndXJhYmxlJzogdHJ1ZSxcbiAgICAgICdlbnVtZXJhYmxlJzogdHJ1ZSxcbiAgICAgICd2YWx1ZSc6IHZhbHVlLFxuICAgICAgJ3dyaXRhYmxlJzogdHJ1ZVxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIG9iamVjdFtrZXldID0gdmFsdWU7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlQXNzaWduVmFsdWU7XG4iLCIvKipcbiAqIENyZWF0ZXMgYSBiYXNlIGZ1bmN0aW9uIGZvciBtZXRob2RzIGxpa2UgYF8uZm9ySW5gIGFuZCBgXy5mb3JPd25gLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtmcm9tUmlnaHRdIFNwZWNpZnkgaXRlcmF0aW5nIGZyb20gcmlnaHQgdG8gbGVmdC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGJhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUJhc2VGb3IoZnJvbVJpZ2h0KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QsIGl0ZXJhdGVlLCBrZXlzRnVuYykge1xuICAgIHZhciBpbmRleCA9IC0xLFxuICAgICAgICBpdGVyYWJsZSA9IE9iamVjdChvYmplY3QpLFxuICAgICAgICBwcm9wcyA9IGtleXNGdW5jKG9iamVjdCksXG4gICAgICAgIGxlbmd0aCA9IHByb3BzLmxlbmd0aDtcblxuICAgIHdoaWxlIChsZW5ndGgtLSkge1xuICAgICAgdmFyIGtleSA9IHByb3BzW2Zyb21SaWdodCA/IGxlbmd0aCA6ICsraW5kZXhdO1xuICAgICAgaWYgKGl0ZXJhdGVlKGl0ZXJhYmxlW2tleV0sIGtleSwgaXRlcmFibGUpID09PSBmYWxzZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdDtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVCYXNlRm9yO1xuIiwidmFyIGNyZWF0ZUJhc2VGb3IgPSByZXF1aXJlKCcuL19jcmVhdGVCYXNlRm9yJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGJhc2VGb3JPd25gIHdoaWNoIGl0ZXJhdGVzIG92ZXIgYG9iamVjdGBcbiAqIHByb3BlcnRpZXMgcmV0dXJuZWQgYnkgYGtleXNGdW5jYCBhbmQgaW52b2tlcyBgaXRlcmF0ZWVgIGZvciBlYWNoIHByb3BlcnR5LlxuICogSXRlcmF0ZWUgZnVuY3Rpb25zIG1heSBleGl0IGl0ZXJhdGlvbiBlYXJseSBieSBleHBsaWNpdGx5IHJldHVybmluZyBgZmFsc2VgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGtleXNGdW5jIFRoZSBmdW5jdGlvbiB0byBnZXQgdGhlIGtleXMgb2YgYG9iamVjdGAuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIGBvYmplY3RgLlxuICovXG52YXIgYmFzZUZvciA9IGNyZWF0ZUJhc2VGb3IoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlRm9yO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy50aW1lc2Agd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZSBzaG9ydGhhbmRzXG4gKiBvciBtYXggYXJyYXkgbGVuZ3RoIGNoZWNrcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IG4gVGhlIG51bWJlciBvZiB0aW1lcyB0byBpbnZva2UgYGl0ZXJhdGVlYC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHJlc3VsdHMuXG4gKi9cbmZ1bmN0aW9uIGJhc2VUaW1lcyhuLCBpdGVyYXRlZSkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IEFycmF5KG4pO1xuXG4gIHdoaWxlICgrK2luZGV4IDwgbikge1xuICAgIHJlc3VsdFtpbmRleF0gPSBpdGVyYXRlZShpbmRleCk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlVGltZXM7XG4iLCIvKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgYGZhbHNlYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMTMuMFxuICogQGNhdGVnb3J5IFV0aWxcbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udGltZXMoMiwgXy5zdHViRmFsc2UpO1xuICogLy8gPT4gW2ZhbHNlLCBmYWxzZV1cbiAqL1xuZnVuY3Rpb24gc3R1YkZhbHNlKCkge1xuICByZXR1cm4gZmFsc2U7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3R1YkZhbHNlO1xuIiwidmFyIHJvb3QgPSByZXF1aXJlKCcuL19yb290JyksXG4gICAgc3R1YkZhbHNlID0gcmVxdWlyZSgnLi9zdHViRmFsc2UnKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBleHBvcnRzYC4gKi9cbnZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSBmcmVlRXhwb3J0cyAmJiB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJiAhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblxuLyoqIERldGVjdCB0aGUgcG9wdWxhciBDb21tb25KUyBleHRlbnNpb24gYG1vZHVsZS5leHBvcnRzYC4gKi9cbnZhciBtb2R1bGVFeHBvcnRzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLmV4cG9ydHMgPT09IGZyZWVFeHBvcnRzO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBCdWZmZXIgPSBtb2R1bGVFeHBvcnRzID8gcm9vdC5CdWZmZXIgOiB1bmRlZmluZWQ7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIGZvciB0aG9zZSB3aXRoIHRoZSBzYW1lIG5hbWUgYXMgb3RoZXIgYGxvZGFzaGAgbWV0aG9kcy4gKi9cbnZhciBuYXRpdmVJc0J1ZmZlciA9IEJ1ZmZlciA/IEJ1ZmZlci5pc0J1ZmZlciA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGJ1ZmZlci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMy4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGJ1ZmZlciwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQnVmZmVyKG5ldyBCdWZmZXIoMikpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNCdWZmZXIobmV3IFVpbnQ4QXJyYXkoMikpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQnVmZmVyID0gbmF0aXZlSXNCdWZmZXIgfHwgc3R1YkZhbHNlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQnVmZmVyO1xuIiwidmFyIGJhc2VHZXRUYWcgPSByZXF1aXJlKCcuL19iYXNlR2V0VGFnJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyksXG4gICAgaXNPYmplY3RMaWtlID0gcmVxdWlyZSgnLi9pc09iamVjdExpa2UnKTtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGFyZ3NUYWcgPSAnW29iamVjdCBBcmd1bWVudHNdJyxcbiAgICBhcnJheVRhZyA9ICdbb2JqZWN0IEFycmF5XScsXG4gICAgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJyxcbiAgICBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICBudW1iZXJUYWcgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzZXRUYWcgPSAnW29iamVjdCBTZXRdJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJyxcbiAgICB3ZWFrTWFwVGFnID0gJ1tvYmplY3QgV2Vha01hcF0nO1xuXG52YXIgYXJyYXlCdWZmZXJUYWcgPSAnW29iamVjdCBBcnJheUJ1ZmZlcl0nLFxuICAgIGRhdGFWaWV3VGFnID0gJ1tvYmplY3QgRGF0YVZpZXddJyxcbiAgICBmbG9hdDMyVGFnID0gJ1tvYmplY3QgRmxvYXQzMkFycmF5XScsXG4gICAgZmxvYXQ2NFRhZyA9ICdbb2JqZWN0IEZsb2F0NjRBcnJheV0nLFxuICAgIGludDhUYWcgPSAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICBpbnQxNlRhZyA9ICdbb2JqZWN0IEludDE2QXJyYXldJyxcbiAgICBpbnQzMlRhZyA9ICdbb2JqZWN0IEludDMyQXJyYXldJyxcbiAgICB1aW50OFRhZyA9ICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICB1aW50OENsYW1wZWRUYWcgPSAnW29iamVjdCBVaW50OENsYW1wZWRBcnJheV0nLFxuICAgIHVpbnQxNlRhZyA9ICdbb2JqZWN0IFVpbnQxNkFycmF5XScsXG4gICAgdWludDMyVGFnID0gJ1tvYmplY3QgVWludDMyQXJyYXldJztcblxuLyoqIFVzZWQgdG8gaWRlbnRpZnkgYHRvU3RyaW5nVGFnYCB2YWx1ZXMgb2YgdHlwZWQgYXJyYXlzLiAqL1xudmFyIHR5cGVkQXJyYXlUYWdzID0ge307XG50eXBlZEFycmF5VGFnc1tmbG9hdDMyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Zsb2F0NjRUYWddID1cbnR5cGVkQXJyYXlUYWdzW2ludDhUYWddID0gdHlwZWRBcnJheVRhZ3NbaW50MTZUYWddID1cbnR5cGVkQXJyYXlUYWdzW2ludDMyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW3VpbnQ4VGFnXSA9XG50eXBlZEFycmF5VGFnc1t1aW50OENsYW1wZWRUYWddID0gdHlwZWRBcnJheVRhZ3NbdWludDE2VGFnXSA9XG50eXBlZEFycmF5VGFnc1t1aW50MzJUYWddID0gdHJ1ZTtcbnR5cGVkQXJyYXlUYWdzW2FyZ3NUYWddID0gdHlwZWRBcnJheVRhZ3NbYXJyYXlUYWddID1cbnR5cGVkQXJyYXlUYWdzW2FycmF5QnVmZmVyVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Jvb2xUYWddID1cbnR5cGVkQXJyYXlUYWdzW2RhdGFWaWV3VGFnXSA9IHR5cGVkQXJyYXlUYWdzW2RhdGVUYWddID1cbnR5cGVkQXJyYXlUYWdzW2Vycm9yVGFnXSA9IHR5cGVkQXJyYXlUYWdzW2Z1bmNUYWddID1cbnR5cGVkQXJyYXlUYWdzW21hcFRhZ10gPSB0eXBlZEFycmF5VGFnc1tudW1iZXJUYWddID1cbnR5cGVkQXJyYXlUYWdzW29iamVjdFRhZ10gPSB0eXBlZEFycmF5VGFnc1tyZWdleHBUYWddID1cbnR5cGVkQXJyYXlUYWdzW3NldFRhZ10gPSB0eXBlZEFycmF5VGFnc1tzdHJpbmdUYWddID1cbnR5cGVkQXJyYXlUYWdzW3dlYWtNYXBUYWddID0gZmFsc2U7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNUeXBlZEFycmF5YCB3aXRob3V0IE5vZGUuanMgb3B0aW1pemF0aW9ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHR5cGVkIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc1R5cGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiZcbiAgICBpc0xlbmd0aCh2YWx1ZS5sZW5ndGgpICYmICEhdHlwZWRBcnJheVRhZ3NbYmFzZUdldFRhZyh2YWx1ZSldO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc1R5cGVkQXJyYXk7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnVuYXJ5YCB3aXRob3V0IHN1cHBvcnQgZm9yIHN0b3JpbmcgbWV0YWRhdGEuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGNhcCBhcmd1bWVudHMgZm9yLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY2FwcGVkIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlVW5hcnkoZnVuYykge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWUpIHtcbiAgICByZXR1cm4gZnVuYyh2YWx1ZSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVVuYXJ5O1xuIiwidmFyIGZyZWVHbG9iYWwgPSByZXF1aXJlKCcuL19mcmVlR2xvYmFsJyk7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AuICovXG52YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgbW9kdWxlYC4gKi9cbnZhciBmcmVlTW9kdWxlID0gZnJlZUV4cG9ydHMgJiYgdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiYgIW1vZHVsZS5ub2RlVHlwZSAmJiBtb2R1bGU7XG5cbi8qKiBEZXRlY3QgdGhlIHBvcHVsYXIgQ29tbW9uSlMgZXh0ZW5zaW9uIGBtb2R1bGUuZXhwb3J0c2AuICovXG52YXIgbW9kdWxlRXhwb3J0cyA9IGZyZWVNb2R1bGUgJiYgZnJlZU1vZHVsZS5leHBvcnRzID09PSBmcmVlRXhwb3J0cztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBwcm9jZXNzYCBmcm9tIE5vZGUuanMuICovXG52YXIgZnJlZVByb2Nlc3MgPSBtb2R1bGVFeHBvcnRzICYmIGZyZWVHbG9iYWwucHJvY2VzcztcblxuLyoqIFVzZWQgdG8gYWNjZXNzIGZhc3RlciBOb2RlLmpzIGhlbHBlcnMuICovXG52YXIgbm9kZVV0aWwgPSAoZnVuY3Rpb24oKSB7XG4gIHRyeSB7XG4gICAgLy8gVXNlIGB1dGlsLnR5cGVzYCBmb3IgTm9kZS5qcyAxMCsuXG4gICAgdmFyIHR5cGVzID0gZnJlZU1vZHVsZSAmJiBmcmVlTW9kdWxlLnJlcXVpcmUgJiYgZnJlZU1vZHVsZS5yZXF1aXJlKCd1dGlsJykudHlwZXM7XG5cbiAgICBpZiAodHlwZXMpIHtcbiAgICAgIHJldHVybiB0eXBlcztcbiAgICB9XG5cbiAgICAvLyBMZWdhY3kgYHByb2Nlc3MuYmluZGluZygndXRpbCcpYCBmb3IgTm9kZS5qcyA8IDEwLlxuICAgIHJldHVybiBmcmVlUHJvY2VzcyAmJiBmcmVlUHJvY2Vzcy5iaW5kaW5nICYmIGZyZWVQcm9jZXNzLmJpbmRpbmcoJ3V0aWwnKTtcbiAgfSBjYXRjaCAoZSkge31cbn0oKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gbm9kZVV0aWw7XG4iLCJ2YXIgYmFzZUlzVHlwZWRBcnJheSA9IHJlcXVpcmUoJy4vX2Jhc2VJc1R5cGVkQXJyYXknKSxcbiAgICBiYXNlVW5hcnkgPSByZXF1aXJlKCcuL19iYXNlVW5hcnknKSxcbiAgICBub2RlVXRpbCA9IHJlcXVpcmUoJy4vX25vZGVVdGlsJyk7XG5cbi8qIE5vZGUuanMgaGVscGVyIHJlZmVyZW5jZXMuICovXG52YXIgbm9kZUlzVHlwZWRBcnJheSA9IG5vZGVVdGlsICYmIG5vZGVVdGlsLmlzVHlwZWRBcnJheTtcblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgdHlwZWQgYXJyYXkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAzLjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYSB0eXBlZCBhcnJheSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzVHlwZWRBcnJheShuZXcgVWludDhBcnJheSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1R5cGVkQXJyYXkoW10pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzVHlwZWRBcnJheSA9IG5vZGVJc1R5cGVkQXJyYXkgPyBiYXNlVW5hcnkobm9kZUlzVHlwZWRBcnJheSkgOiBiYXNlSXNUeXBlZEFycmF5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzVHlwZWRBcnJheTtcbiIsInZhciBiYXNlVGltZXMgPSByZXF1aXJlKCcuL19iYXNlVGltZXMnKSxcbiAgICBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoJy4vaXNBcmd1bWVudHMnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5JyksXG4gICAgaXNCdWZmZXIgPSByZXF1aXJlKCcuL2lzQnVmZmVyJyksXG4gICAgaXNJbmRleCA9IHJlcXVpcmUoJy4vX2lzSW5kZXgnKSxcbiAgICBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCcuL2lzVHlwZWRBcnJheScpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIGVudW1lcmFibGUgcHJvcGVydHkgbmFtZXMgb2YgdGhlIGFycmF5LWxpa2UgYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGluaGVyaXRlZCBTcGVjaWZ5IHJldHVybmluZyBpbmhlcml0ZWQgcHJvcGVydHkgbmFtZXMuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG5mdW5jdGlvbiBhcnJheUxpa2VLZXlzKHZhbHVlLCBpbmhlcml0ZWQpIHtcbiAgdmFyIGlzQXJyID0gaXNBcnJheSh2YWx1ZSksXG4gICAgICBpc0FyZyA9ICFpc0FyciAmJiBpc0FyZ3VtZW50cyh2YWx1ZSksXG4gICAgICBpc0J1ZmYgPSAhaXNBcnIgJiYgIWlzQXJnICYmIGlzQnVmZmVyKHZhbHVlKSxcbiAgICAgIGlzVHlwZSA9ICFpc0FyciAmJiAhaXNBcmcgJiYgIWlzQnVmZiAmJiBpc1R5cGVkQXJyYXkodmFsdWUpLFxuICAgICAgc2tpcEluZGV4ZXMgPSBpc0FyciB8fCBpc0FyZyB8fCBpc0J1ZmYgfHwgaXNUeXBlLFxuICAgICAgcmVzdWx0ID0gc2tpcEluZGV4ZXMgPyBiYXNlVGltZXModmFsdWUubGVuZ3RoLCBTdHJpbmcpIDogW10sXG4gICAgICBsZW5ndGggPSByZXN1bHQubGVuZ3RoO1xuXG4gIGZvciAodmFyIGtleSBpbiB2YWx1ZSkge1xuICAgIGlmICgoaW5oZXJpdGVkIHx8IGhhc093blByb3BlcnR5LmNhbGwodmFsdWUsIGtleSkpICYmXG4gICAgICAgICEoc2tpcEluZGV4ZXMgJiYgKFxuICAgICAgICAgICAvLyBTYWZhcmkgOSBoYXMgZW51bWVyYWJsZSBgYXJndW1lbnRzLmxlbmd0aGAgaW4gc3RyaWN0IG1vZGUuXG4gICAgICAgICAgIGtleSA9PSAnbGVuZ3RoJyB8fFxuICAgICAgICAgICAvLyBOb2RlLmpzIDAuMTAgaGFzIGVudW1lcmFibGUgbm9uLWluZGV4IHByb3BlcnRpZXMgb24gYnVmZmVycy5cbiAgICAgICAgICAgKGlzQnVmZiAmJiAoa2V5ID09ICdvZmZzZXQnIHx8IGtleSA9PSAncGFyZW50JykpIHx8XG4gICAgICAgICAgIC8vIFBoYW50b21KUyAyIGhhcyBlbnVtZXJhYmxlIG5vbi1pbmRleCBwcm9wZXJ0aWVzIG9uIHR5cGVkIGFycmF5cy5cbiAgICAgICAgICAgKGlzVHlwZSAmJiAoa2V5ID09ICdidWZmZXInIHx8IGtleSA9PSAnYnl0ZUxlbmd0aCcgfHwga2V5ID09ICdieXRlT2Zmc2V0JykpIHx8XG4gICAgICAgICAgIC8vIFNraXAgaW5kZXggcHJvcGVydGllcy5cbiAgICAgICAgICAgaXNJbmRleChrZXksIGxlbmd0aClcbiAgICAgICAgKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKGtleSk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlMaWtlS2V5cztcbiIsIi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgbGlrZWx5IGEgcHJvdG90eXBlIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHByb3RvdHlwZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc1Byb3RvdHlwZSh2YWx1ZSkge1xuICB2YXIgQ3RvciA9IHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yLFxuICAgICAgcHJvdG8gPSAodHlwZW9mIEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBDdG9yLnByb3RvdHlwZSkgfHwgb2JqZWN0UHJvdG87XG5cbiAgcmV0dXJuIHZhbHVlID09PSBwcm90bztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1Byb3RvdHlwZTtcbiIsIi8qKlxuICogQ3JlYXRlcyBhIHVuYXJ5IGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBgZnVuY2Agd2l0aCBpdHMgYXJndW1lbnQgdHJhbnNmb3JtZWQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHdyYXAuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0cmFuc2Zvcm0gVGhlIGFyZ3VtZW50IHRyYW5zZm9ybS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBvdmVyQXJnKGZ1bmMsIHRyYW5zZm9ybSkge1xuICByZXR1cm4gZnVuY3Rpb24oYXJnKSB7XG4gICAgcmV0dXJuIGZ1bmModHJhbnNmb3JtKGFyZykpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG92ZXJBcmc7XG4iLCJ2YXIgb3ZlckFyZyA9IHJlcXVpcmUoJy4vX292ZXJBcmcnKTtcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgZm9yIHRob3NlIHdpdGggdGhlIHNhbWUgbmFtZSBhcyBvdGhlciBgbG9kYXNoYCBtZXRob2RzLiAqL1xudmFyIG5hdGl2ZUtleXMgPSBvdmVyQXJnKE9iamVjdC5rZXlzLCBPYmplY3QpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5hdGl2ZUtleXM7XG4iLCJ2YXIgaXNQcm90b3R5cGUgPSByZXF1aXJlKCcuL19pc1Byb3RvdHlwZScpLFxuICAgIG5hdGl2ZUtleXMgPSByZXF1aXJlKCcuL19uYXRpdmVLZXlzJyk7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ua2V5c2Agd2hpY2ggZG9lc24ndCB0cmVhdCBzcGFyc2UgYXJyYXlzIGFzIGRlbnNlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzLlxuICovXG5mdW5jdGlvbiBiYXNlS2V5cyhvYmplY3QpIHtcbiAgaWYgKCFpc1Byb3RvdHlwZShvYmplY3QpKSB7XG4gICAgcmV0dXJuIG5hdGl2ZUtleXMob2JqZWN0KTtcbiAgfVxuICB2YXIgcmVzdWx0ID0gW107XG4gIGZvciAodmFyIGtleSBpbiBPYmplY3Qob2JqZWN0KSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSAmJiBrZXkgIT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgcmVzdWx0LnB1c2goa2V5KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlS2V5cztcbiIsInZhciBpc0Z1bmN0aW9uID0gcmVxdWlyZSgnLi9pc0Z1bmN0aW9uJyksXG4gICAgaXNMZW5ndGggPSByZXF1aXJlKCcuL2lzTGVuZ3RoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYXJyYXktbGlrZS4gQSB2YWx1ZSBpcyBjb25zaWRlcmVkIGFycmF5LWxpa2UgaWYgaXQnc1xuICogbm90IGEgZnVuY3Rpb24gYW5kIGhhcyBhIGB2YWx1ZS5sZW5ndGhgIHRoYXQncyBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiBvclxuICogZXF1YWwgdG8gYDBgIGFuZCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYE51bWJlci5NQVhfU0FGRV9JTlRFR0VSYC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhcnJheS1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXlMaWtlKGRvY3VtZW50LmJvZHkuY2hpbGRyZW4pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoJ2FiYycpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheUxpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSAhPSBudWxsICYmIGlzTGVuZ3RoKHZhbHVlLmxlbmd0aCkgJiYgIWlzRnVuY3Rpb24odmFsdWUpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlzQXJyYXlMaWtlO1xuIiwidmFyIGFycmF5TGlrZUtleXMgPSByZXF1aXJlKCcuL19hcnJheUxpa2VLZXlzJyksXG4gICAgYmFzZUtleXMgPSByZXF1aXJlKCcuL19iYXNlS2V5cycpLFxuICAgIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi9pc0FycmF5TGlrZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gYXJyYXkgb2YgdGhlIG93biBlbnVtZXJhYmxlIHByb3BlcnR5IG5hbWVzIG9mIGBvYmplY3RgLlxuICpcbiAqICoqTm90ZToqKiBOb24tb2JqZWN0IHZhbHVlcyBhcmUgY29lcmNlZCB0byBvYmplY3RzLiBTZWUgdGhlXG4gKiBbRVMgc3BlY10oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtb2JqZWN0LmtleXMpXG4gKiBmb3IgbW9yZSBkZXRhaWxzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBzaW5jZSAwLjEuMFxuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgYXJyYXkgb2YgcHJvcGVydHkgbmFtZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqIGZ1bmN0aW9uIEZvbygpIHtcbiAqICAgdGhpcy5hID0gMTtcbiAqICAgdGhpcy5iID0gMjtcbiAqIH1cbiAqXG4gKiBGb28ucHJvdG90eXBlLmMgPSAzO1xuICpcbiAqIF8ua2V5cyhuZXcgRm9vKTtcbiAqIC8vID0+IFsnYScsICdiJ10gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqXG4gKiBfLmtleXMoJ2hpJyk7XG4gKiAvLyA9PiBbJzAnLCAnMSddXG4gKi9cbmZ1bmN0aW9uIGtleXMob2JqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5TGlrZShvYmplY3QpID8gYXJyYXlMaWtlS2V5cyhvYmplY3QpIDogYmFzZUtleXMob2JqZWN0KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBrZXlzO1xuIiwidmFyIGJhc2VGb3IgPSByZXF1aXJlKCcuL19iYXNlRm9yJyksXG4gICAga2V5cyA9IHJlcXVpcmUoJy4va2V5cycpO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmZvck93bmAgd2l0aG91dCBzdXBwb3J0IGZvciBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gaXRlcmF0ZSBvdmVyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXRlcmF0ZWUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgYG9iamVjdGAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VGb3JPd24ob2JqZWN0LCBpdGVyYXRlZSkge1xuICByZXR1cm4gb2JqZWN0ICYmIGJhc2VGb3Iob2JqZWN0LCBpdGVyYXRlZSwga2V5cyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUZvck93bjtcbiIsInZhciBMaXN0Q2FjaGUgPSByZXF1aXJlKCcuL19MaXN0Q2FjaGUnKTtcblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBzdGFjay5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgY2xlYXJcbiAqIEBtZW1iZXJPZiBTdGFja1xuICovXG5mdW5jdGlvbiBzdGFja0NsZWFyKCkge1xuICB0aGlzLl9fZGF0YV9fID0gbmV3IExpc3RDYWNoZTtcbiAgdGhpcy5zaXplID0gMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdGFja0NsZWFyO1xuIiwiLyoqXG4gKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgc3RhY2suXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIFN0YWNrXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHJlbW92ZS5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgZW50cnkgd2FzIHJlbW92ZWQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gc3RhY2tEZWxldGUoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIHJlc3VsdCA9IGRhdGFbJ2RlbGV0ZSddKGtleSk7XG5cbiAgdGhpcy5zaXplID0gZGF0YS5zaXplO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWNrRGVsZXRlO1xuIiwiLyoqXG4gKiBHZXRzIHRoZSBzdGFjayB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIFN0YWNrXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gc3RhY2tHZXQoa2V5KSB7XG4gIHJldHVybiB0aGlzLl9fZGF0YV9fLmdldChrZXkpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWNrR2V0O1xuIiwiLyoqXG4gKiBDaGVja3MgaWYgYSBzdGFjayB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBTdGFja1xuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIHN0YWNrSGFzKGtleSkge1xuICByZXR1cm4gdGhpcy5fX2RhdGFfXy5oYXMoa2V5KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdGFja0hhcztcbiIsInZhciBMaXN0Q2FjaGUgPSByZXF1aXJlKCcuL19MaXN0Q2FjaGUnKSxcbiAgICBNYXAgPSByZXF1aXJlKCcuL19NYXAnKSxcbiAgICBNYXBDYWNoZSA9IHJlcXVpcmUoJy4vX01hcENhY2hlJyk7XG5cbi8qKiBVc2VkIGFzIHRoZSBzaXplIHRvIGVuYWJsZSBsYXJnZSBhcnJheSBvcHRpbWl6YXRpb25zLiAqL1xudmFyIExBUkdFX0FSUkFZX1NJWkUgPSAyMDA7XG5cbi8qKlxuICogU2V0cyB0aGUgc3RhY2sgYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgU3RhY2tcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgc3RhY2sgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIHN0YWNrU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBpZiAoZGF0YSBpbnN0YW5jZW9mIExpc3RDYWNoZSkge1xuICAgIHZhciBwYWlycyA9IGRhdGEuX19kYXRhX187XG4gICAgaWYgKCFNYXAgfHwgKHBhaXJzLmxlbmd0aCA8IExBUkdFX0FSUkFZX1NJWkUgLSAxKSkge1xuICAgICAgcGFpcnMucHVzaChba2V5LCB2YWx1ZV0pO1xuICAgICAgdGhpcy5zaXplID0gKytkYXRhLnNpemU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgZGF0YSA9IHRoaXMuX19kYXRhX18gPSBuZXcgTWFwQ2FjaGUocGFpcnMpO1xuICB9XG4gIGRhdGEuc2V0KGtleSwgdmFsdWUpO1xuICB0aGlzLnNpemUgPSBkYXRhLnNpemU7XG4gIHJldHVybiB0aGlzO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YWNrU2V0O1xuIiwidmFyIExpc3RDYWNoZSA9IHJlcXVpcmUoJy4vX0xpc3RDYWNoZScpLFxuICAgIHN0YWNrQ2xlYXIgPSByZXF1aXJlKCcuL19zdGFja0NsZWFyJyksXG4gICAgc3RhY2tEZWxldGUgPSByZXF1aXJlKCcuL19zdGFja0RlbGV0ZScpLFxuICAgIHN0YWNrR2V0ID0gcmVxdWlyZSgnLi9fc3RhY2tHZXQnKSxcbiAgICBzdGFja0hhcyA9IHJlcXVpcmUoJy4vX3N0YWNrSGFzJyksXG4gICAgc3RhY2tTZXQgPSByZXF1aXJlKCcuL19zdGFja1NldCcpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzdGFjayBjYWNoZSBvYmplY3QgdG8gc3RvcmUga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBTdGFjayhlbnRyaWVzKSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyA9IG5ldyBMaXN0Q2FjaGUoZW50cmllcyk7XG4gIHRoaXMuc2l6ZSA9IGRhdGEuc2l6ZTtcbn1cblxuLy8gQWRkIG1ldGhvZHMgdG8gYFN0YWNrYC5cblN0YWNrLnByb3RvdHlwZS5jbGVhciA9IHN0YWNrQ2xlYXI7XG5TdGFjay5wcm90b3R5cGVbJ2RlbGV0ZSddID0gc3RhY2tEZWxldGU7XG5TdGFjay5wcm90b3R5cGUuZ2V0ID0gc3RhY2tHZXQ7XG5TdGFjay5wcm90b3R5cGUuaGFzID0gc3RhY2tIYXM7XG5TdGFjay5wcm90b3R5cGUuc2V0ID0gc3RhY2tTZXQ7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhY2s7XG4iLCIvKiogVXNlZCB0byBzdGFuZC1pbiBmb3IgYHVuZGVmaW5lZGAgaGFzaCB2YWx1ZXMuICovXG52YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG5cbi8qKlxuICogQWRkcyBgdmFsdWVgIHRvIHRoZSBhcnJheSBjYWNoZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgYWRkXG4gKiBAbWVtYmVyT2YgU2V0Q2FjaGVcbiAqIEBhbGlhcyBwdXNoXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjYWNoZS5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGNhY2hlIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBzZXRDYWNoZUFkZCh2YWx1ZSkge1xuICB0aGlzLl9fZGF0YV9fLnNldCh2YWx1ZSwgSEFTSF9VTkRFRklORUQpO1xuICByZXR1cm4gdGhpcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRDYWNoZUFkZDtcbiIsIi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgaW4gdGhlIGFycmF5IGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBTZXRDYWNoZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2VhcmNoIGZvci5cbiAqIEByZXR1cm5zIHtudW1iZXJ9IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgZm91bmQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gc2V0Q2FjaGVIYXModmFsdWUpIHtcbiAgcmV0dXJuIHRoaXMuX19kYXRhX18uaGFzKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRDYWNoZUhhcztcbiIsInZhciBNYXBDYWNoZSA9IHJlcXVpcmUoJy4vX01hcENhY2hlJyksXG4gICAgc2V0Q2FjaGVBZGQgPSByZXF1aXJlKCcuL19zZXRDYWNoZUFkZCcpLFxuICAgIHNldENhY2hlSGFzID0gcmVxdWlyZSgnLi9fc2V0Q2FjaGVIYXMnKTtcblxuLyoqXG4gKlxuICogQ3JlYXRlcyBhbiBhcnJheSBjYWNoZSBvYmplY3QgdG8gc3RvcmUgdW5pcXVlIHZhbHVlcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0FycmF5fSBbdmFsdWVzXSBUaGUgdmFsdWVzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBTZXRDYWNoZSh2YWx1ZXMpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSB2YWx1ZXMgPT0gbnVsbCA/IDAgOiB2YWx1ZXMubGVuZ3RoO1xuXG4gIHRoaXMuX19kYXRhX18gPSBuZXcgTWFwQ2FjaGU7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdGhpcy5hZGQodmFsdWVzW2luZGV4XSk7XG4gIH1cbn1cblxuLy8gQWRkIG1ldGhvZHMgdG8gYFNldENhY2hlYC5cblNldENhY2hlLnByb3RvdHlwZS5hZGQgPSBTZXRDYWNoZS5wcm90b3R5cGUucHVzaCA9IHNldENhY2hlQWRkO1xuU2V0Q2FjaGUucHJvdG90eXBlLmhhcyA9IHNldENhY2hlSGFzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNldENhY2hlO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8uc29tZWAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlXG4gKiBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbnkgZWxlbWVudCBwYXNzZXMgdGhlIHByZWRpY2F0ZSBjaGVjayxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5U29tZShhcnJheSwgcHJlZGljYXRlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkgPT0gbnVsbCA/IDAgOiBhcnJheS5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBpZiAocHJlZGljYXRlKGFycmF5W2luZGV4XSwgaW5kZXgsIGFycmF5KSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheVNvbWU7XG4iLCIvKipcbiAqIENoZWNrcyBpZiBhIGBjYWNoZWAgdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IGNhY2hlIFRoZSBjYWNoZSB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBjYWNoZUhhcyhjYWNoZSwga2V5KSB7XG4gIHJldHVybiBjYWNoZS5oYXMoa2V5KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjYWNoZUhhcztcbiIsInZhciBTZXRDYWNoZSA9IHJlcXVpcmUoJy4vX1NldENhY2hlJyksXG4gICAgYXJyYXlTb21lID0gcmVxdWlyZSgnLi9fYXJyYXlTb21lJyksXG4gICAgY2FjaGVIYXMgPSByZXF1aXJlKCcuL19jYWNoZUhhcycpO1xuXG4vKiogVXNlZCB0byBjb21wb3NlIGJpdG1hc2tzIGZvciB2YWx1ZSBjb21wYXJpc29ucy4gKi9cbnZhciBDT01QQVJFX1BBUlRJQUxfRkxBRyA9IDEsXG4gICAgQ09NUEFSRV9VTk9SREVSRURfRkxBRyA9IDI7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBhcnJheXMgd2l0aCBzdXBwb3J0IGZvclxuICogcGFydGlhbCBkZWVwIGNvbXBhcmlzb25zLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7QXJyYXl9IG90aGVyIFRoZSBvdGhlciBhcnJheSB0byBjb21wYXJlLlxuICogQHBhcmFtIHtudW1iZXJ9IGJpdG1hc2sgVGhlIGJpdG1hc2sgZmxhZ3MuIFNlZSBgYmFzZUlzRXF1YWxgIGZvciBtb3JlIGRldGFpbHMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjdXN0b21pemVyIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge09iamVjdH0gc3RhY2sgVHJhY2tzIHRyYXZlcnNlZCBgYXJyYXlgIGFuZCBgb3RoZXJgIG9iamVjdHMuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGFycmF5cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbEFycmF5cyhhcnJheSwgb3RoZXIsIGJpdG1hc2ssIGN1c3RvbWl6ZXIsIGVxdWFsRnVuYywgc3RhY2spIHtcbiAgdmFyIGlzUGFydGlhbCA9IGJpdG1hc2sgJiBDT01QQVJFX1BBUlRJQUxfRkxBRyxcbiAgICAgIGFyckxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgIG90aExlbmd0aCA9IG90aGVyLmxlbmd0aDtcblxuICBpZiAoYXJyTGVuZ3RoICE9IG90aExlbmd0aCAmJiAhKGlzUGFydGlhbCAmJiBvdGhMZW5ndGggPiBhcnJMZW5ndGgpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIENoZWNrIHRoYXQgY3ljbGljIHZhbHVlcyBhcmUgZXF1YWwuXG4gIHZhciBhcnJTdGFja2VkID0gc3RhY2suZ2V0KGFycmF5KTtcbiAgdmFyIG90aFN0YWNrZWQgPSBzdGFjay5nZXQob3RoZXIpO1xuICBpZiAoYXJyU3RhY2tlZCAmJiBvdGhTdGFja2VkKSB7XG4gICAgcmV0dXJuIGFyclN0YWNrZWQgPT0gb3RoZXIgJiYgb3RoU3RhY2tlZCA9PSBhcnJheTtcbiAgfVxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IHRydWUsXG4gICAgICBzZWVuID0gKGJpdG1hc2sgJiBDT01QQVJFX1VOT1JERVJFRF9GTEFHKSA/IG5ldyBTZXRDYWNoZSA6IHVuZGVmaW5lZDtcblxuICBzdGFjay5zZXQoYXJyYXksIG90aGVyKTtcbiAgc3RhY2suc2V0KG90aGVyLCBhcnJheSk7XG5cbiAgLy8gSWdub3JlIG5vbi1pbmRleCBwcm9wZXJ0aWVzLlxuICB3aGlsZSAoKytpbmRleCA8IGFyckxlbmd0aCkge1xuICAgIHZhciBhcnJWYWx1ZSA9IGFycmF5W2luZGV4XSxcbiAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltpbmRleF07XG5cbiAgICBpZiAoY3VzdG9taXplcikge1xuICAgICAgdmFyIGNvbXBhcmVkID0gaXNQYXJ0aWFsXG4gICAgICAgID8gY3VzdG9taXplcihvdGhWYWx1ZSwgYXJyVmFsdWUsIGluZGV4LCBvdGhlciwgYXJyYXksIHN0YWNrKVxuICAgICAgICA6IGN1c3RvbWl6ZXIoYXJyVmFsdWUsIG90aFZhbHVlLCBpbmRleCwgYXJyYXksIG90aGVyLCBzdGFjayk7XG4gICAgfVxuICAgIGlmIChjb21wYXJlZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoY29tcGFyZWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICAvLyBSZWN1cnNpdmVseSBjb21wYXJlIGFycmF5cyAoc3VzY2VwdGlibGUgdG8gY2FsbCBzdGFjayBsaW1pdHMpLlxuICAgIGlmIChzZWVuKSB7XG4gICAgICBpZiAoIWFycmF5U29tZShvdGhlciwgZnVuY3Rpb24ob3RoVmFsdWUsIG90aEluZGV4KSB7XG4gICAgICAgICAgICBpZiAoIWNhY2hlSGFzKHNlZW4sIG90aEluZGV4KSAmJlxuICAgICAgICAgICAgICAgIChhcnJWYWx1ZSA9PT0gb3RoVmFsdWUgfHwgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgYml0bWFzaywgY3VzdG9taXplciwgc3RhY2spKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2Vlbi5wdXNoKG90aEluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KSkge1xuICAgICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghKFxuICAgICAgICAgIGFyclZhbHVlID09PSBvdGhWYWx1ZSB8fFxuICAgICAgICAgICAgZXF1YWxGdW5jKGFyclZhbHVlLCBvdGhWYWx1ZSwgYml0bWFzaywgY3VzdG9taXplciwgc3RhY2spXG4gICAgICAgICkpIHtcbiAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHN0YWNrWydkZWxldGUnXShhcnJheSk7XG4gIHN0YWNrWydkZWxldGUnXShvdGhlcik7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZXF1YWxBcnJheXM7XG4iLCJ2YXIgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgVWludDhBcnJheSA9IHJvb3QuVWludDhBcnJheTtcblxubW9kdWxlLmV4cG9ydHMgPSBVaW50OEFycmF5O1xuIiwiLyoqXG4gKiBDb252ZXJ0cyBgbWFwYCB0byBpdHMga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gbWFwIFRoZSBtYXAgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUga2V5LXZhbHVlIHBhaXJzLlxuICovXG5mdW5jdGlvbiBtYXBUb0FycmF5KG1hcCkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IEFycmF5KG1hcC5zaXplKTtcblxuICBtYXAuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgcmVzdWx0WysraW5kZXhdID0gW2tleSwgdmFsdWVdO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYXBUb0FycmF5O1xuIiwiLyoqXG4gKiBDb252ZXJ0cyBgc2V0YCB0byBhbiBhcnJheSBvZiBpdHMgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gc2V0IFRoZSBzZXQgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgdmFsdWVzLlxuICovXG5mdW5jdGlvbiBzZXRUb0FycmF5KHNldCkge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIHJlc3VsdCA9IEFycmF5KHNldC5zaXplKTtcblxuICBzZXQuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgIHJlc3VsdFsrK2luZGV4XSA9IHZhbHVlO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzZXRUb0FycmF5O1xuIiwidmFyIFN5bWJvbCA9IHJlcXVpcmUoJy4vX1N5bWJvbCcpLFxuICAgIFVpbnQ4QXJyYXkgPSByZXF1aXJlKCcuL19VaW50OEFycmF5JyksXG4gICAgZXEgPSByZXF1aXJlKCcuL2VxJyksXG4gICAgZXF1YWxBcnJheXMgPSByZXF1aXJlKCcuL19lcXVhbEFycmF5cycpLFxuICAgIG1hcFRvQXJyYXkgPSByZXF1aXJlKCcuL19tYXBUb0FycmF5JyksXG4gICAgc2V0VG9BcnJheSA9IHJlcXVpcmUoJy4vX3NldFRvQXJyYXknKTtcblxuLyoqIFVzZWQgdG8gY29tcG9zZSBiaXRtYXNrcyBmb3IgdmFsdWUgY29tcGFyaXNvbnMuICovXG52YXIgQ09NUEFSRV9QQVJUSUFMX0ZMQUcgPSAxLFxuICAgIENPTVBBUkVfVU5PUkRFUkVEX0ZMQUcgPSAyO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYm9vbFRhZyA9ICdbb2JqZWN0IEJvb2xlYW5dJyxcbiAgICBkYXRlVGFnID0gJ1tvYmplY3QgRGF0ZV0nLFxuICAgIGVycm9yVGFnID0gJ1tvYmplY3QgRXJyb3JdJyxcbiAgICBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICBudW1iZXJUYWcgPSAnW29iamVjdCBOdW1iZXJdJyxcbiAgICByZWdleHBUYWcgPSAnW29iamVjdCBSZWdFeHBdJyxcbiAgICBzZXRUYWcgPSAnW29iamVjdCBTZXRdJyxcbiAgICBzdHJpbmdUYWcgPSAnW29iamVjdCBTdHJpbmddJyxcbiAgICBzeW1ib2xUYWcgPSAnW29iamVjdCBTeW1ib2xdJztcblxudmFyIGFycmF5QnVmZmVyVGFnID0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJyxcbiAgICBkYXRhVmlld1RhZyA9ICdbb2JqZWN0IERhdGFWaWV3XSc7XG5cbi8qKiBVc2VkIHRvIGNvbnZlcnQgc3ltYm9scyB0byBwcmltaXRpdmVzIGFuZCBzdHJpbmdzLiAqL1xudmFyIHN5bWJvbFByb3RvID0gU3ltYm9sID8gU3ltYm9sLnByb3RvdHlwZSA6IHVuZGVmaW5lZCxcbiAgICBzeW1ib2xWYWx1ZU9mID0gc3ltYm9sUHJvdG8gPyBzeW1ib2xQcm90by52YWx1ZU9mIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIEEgc3BlY2lhbGl6ZWQgdmVyc2lvbiBvZiBgYmFzZUlzRXF1YWxEZWVwYCBmb3IgY29tcGFyaW5nIG9iamVjdHMgb2ZcbiAqIHRoZSBzYW1lIGB0b1N0cmluZ1RhZ2AuXG4gKlxuICogKipOb3RlOioqIFRoaXMgZnVuY3Rpb24gb25seSBzdXBwb3J0cyBjb21wYXJpbmcgdmFsdWVzIHdpdGggdGFncyBvZlxuICogYEJvb2xlYW5gLCBgRGF0ZWAsIGBFcnJvcmAsIGBOdW1iZXJgLCBgUmVnRXhwYCwgb3IgYFN0cmluZ2AuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtPYmplY3R9IG90aGVyIFRoZSBvdGhlciBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgVGhlIGB0b1N0cmluZ1RhZ2Agb2YgdGhlIG9iamVjdHMgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBiaXRtYXNrIFRoZSBiaXRtYXNrIGZsYWdzLiBTZWUgYGJhc2VJc0VxdWFsYCBmb3IgbW9yZSBkZXRhaWxzLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY3VzdG9taXplciBUaGUgZnVuY3Rpb24gdG8gY3VzdG9taXplIGNvbXBhcmlzb25zLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZXF1YWxGdW5jIFRoZSBmdW5jdGlvbiB0byBkZXRlcm1pbmUgZXF1aXZhbGVudHMgb2YgdmFsdWVzLlxuICogQHBhcmFtIHtPYmplY3R9IHN0YWNrIFRyYWNrcyB0cmF2ZXJzZWQgYG9iamVjdGAgYW5kIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBlcXVhbEJ5VGFnKG9iamVjdCwgb3RoZXIsIHRhZywgYml0bWFzaywgY3VzdG9taXplciwgZXF1YWxGdW5jLCBzdGFjaykge1xuICBzd2l0Y2ggKHRhZykge1xuICAgIGNhc2UgZGF0YVZpZXdUYWc6XG4gICAgICBpZiAoKG9iamVjdC5ieXRlTGVuZ3RoICE9IG90aGVyLmJ5dGVMZW5ndGgpIHx8XG4gICAgICAgICAgKG9iamVjdC5ieXRlT2Zmc2V0ICE9IG90aGVyLmJ5dGVPZmZzZXQpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIG9iamVjdCA9IG9iamVjdC5idWZmZXI7XG4gICAgICBvdGhlciA9IG90aGVyLmJ1ZmZlcjtcblxuICAgIGNhc2UgYXJyYXlCdWZmZXJUYWc6XG4gICAgICBpZiAoKG9iamVjdC5ieXRlTGVuZ3RoICE9IG90aGVyLmJ5dGVMZW5ndGgpIHx8XG4gICAgICAgICAgIWVxdWFsRnVuYyhuZXcgVWludDhBcnJheShvYmplY3QpLCBuZXcgVWludDhBcnJheShvdGhlcikpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuXG4gICAgY2FzZSBib29sVGFnOlxuICAgIGNhc2UgZGF0ZVRhZzpcbiAgICBjYXNlIG51bWJlclRhZzpcbiAgICAgIC8vIENvZXJjZSBib29sZWFucyB0byBgMWAgb3IgYDBgIGFuZCBkYXRlcyB0byBtaWxsaXNlY29uZHMuXG4gICAgICAvLyBJbnZhbGlkIGRhdGVzIGFyZSBjb2VyY2VkIHRvIGBOYU5gLlxuICAgICAgcmV0dXJuIGVxKCtvYmplY3QsICtvdGhlcik7XG5cbiAgICBjYXNlIGVycm9yVGFnOlxuICAgICAgcmV0dXJuIG9iamVjdC5uYW1lID09IG90aGVyLm5hbWUgJiYgb2JqZWN0Lm1lc3NhZ2UgPT0gb3RoZXIubWVzc2FnZTtcblxuICAgIGNhc2UgcmVnZXhwVGFnOlxuICAgIGNhc2Ugc3RyaW5nVGFnOlxuICAgICAgLy8gQ29lcmNlIHJlZ2V4ZXMgdG8gc3RyaW5ncyBhbmQgdHJlYXQgc3RyaW5ncywgcHJpbWl0aXZlcyBhbmQgb2JqZWN0cyxcbiAgICAgIC8vIGFzIGVxdWFsLiBTZWUgaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXJlZ2V4cC5wcm90b3R5cGUudG9zdHJpbmdcbiAgICAgIC8vIGZvciBtb3JlIGRldGFpbHMuXG4gICAgICByZXR1cm4gb2JqZWN0ID09IChvdGhlciArICcnKTtcblxuICAgIGNhc2UgbWFwVGFnOlxuICAgICAgdmFyIGNvbnZlcnQgPSBtYXBUb0FycmF5O1xuXG4gICAgY2FzZSBzZXRUYWc6XG4gICAgICB2YXIgaXNQYXJ0aWFsID0gYml0bWFzayAmIENPTVBBUkVfUEFSVElBTF9GTEFHO1xuICAgICAgY29udmVydCB8fCAoY29udmVydCA9IHNldFRvQXJyYXkpO1xuXG4gICAgICBpZiAob2JqZWN0LnNpemUgIT0gb3RoZXIuc2l6ZSAmJiAhaXNQYXJ0aWFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIEFzc3VtZSBjeWNsaWMgdmFsdWVzIGFyZSBlcXVhbC5cbiAgICAgIHZhciBzdGFja2VkID0gc3RhY2suZ2V0KG9iamVjdCk7XG4gICAgICBpZiAoc3RhY2tlZCkge1xuICAgICAgICByZXR1cm4gc3RhY2tlZCA9PSBvdGhlcjtcbiAgICAgIH1cbiAgICAgIGJpdG1hc2sgfD0gQ09NUEFSRV9VTk9SREVSRURfRkxBRztcblxuICAgICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgICBzdGFjay5zZXQob2JqZWN0LCBvdGhlcik7XG4gICAgICB2YXIgcmVzdWx0ID0gZXF1YWxBcnJheXMoY29udmVydChvYmplY3QpLCBjb252ZXJ0KG90aGVyKSwgYml0bWFzaywgY3VzdG9taXplciwgZXF1YWxGdW5jLCBzdGFjayk7XG4gICAgICBzdGFja1snZGVsZXRlJ10ob2JqZWN0KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBjYXNlIHN5bWJvbFRhZzpcbiAgICAgIGlmIChzeW1ib2xWYWx1ZU9mKSB7XG4gICAgICAgIHJldHVybiBzeW1ib2xWYWx1ZU9mLmNhbGwob2JqZWN0KSA9PSBzeW1ib2xWYWx1ZU9mLmNhbGwob3RoZXIpO1xuICAgICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbEJ5VGFnO1xuIiwiLyoqXG4gKiBBcHBlbmRzIHRoZSBlbGVtZW50cyBvZiBgdmFsdWVzYCB0byBgYXJyYXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtBcnJheX0gdmFsdWVzIFRoZSB2YWx1ZXMgdG8gYXBwZW5kLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIGBhcnJheWAuXG4gKi9cbmZ1bmN0aW9uIGFycmF5UHVzaChhcnJheSwgdmFsdWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gdmFsdWVzLmxlbmd0aCxcbiAgICAgIG9mZnNldCA9IGFycmF5Lmxlbmd0aDtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGFycmF5W29mZnNldCArIGluZGV4XSA9IHZhbHVlc1tpbmRleF07XG4gIH1cbiAgcmV0dXJuIGFycmF5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5UHVzaDtcbiIsInZhciBhcnJheVB1c2ggPSByZXF1aXJlKCcuL19hcnJheVB1c2gnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYGdldEFsbEtleXNgIGFuZCBgZ2V0QWxsS2V5c0luYCB3aGljaCB1c2VzXG4gKiBga2V5c0Z1bmNgIGFuZCBgc3ltYm9sc0Z1bmNgIHRvIGdldCB0aGUgZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBhbmRcbiAqIHN5bWJvbHMgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGtleXNGdW5jIFRoZSBmdW5jdGlvbiB0byBnZXQgdGhlIGtleXMgb2YgYG9iamVjdGAuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBzeW1ib2xzRnVuYyBUaGUgZnVuY3Rpb24gdG8gZ2V0IHRoZSBzeW1ib2xzIG9mIGBvYmplY3RgLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcyBhbmQgc3ltYm9scy5cbiAqL1xuZnVuY3Rpb24gYmFzZUdldEFsbEtleXMob2JqZWN0LCBrZXlzRnVuYywgc3ltYm9sc0Z1bmMpIHtcbiAgdmFyIHJlc3VsdCA9IGtleXNGdW5jKG9iamVjdCk7XG4gIHJldHVybiBpc0FycmF5KG9iamVjdCkgPyByZXN1bHQgOiBhcnJheVB1c2gocmVzdWx0LCBzeW1ib2xzRnVuYyhvYmplY3QpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlR2V0QWxsS2V5cztcbiIsIi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBfLmZpbHRlcmAgZm9yIGFycmF5cyB3aXRob3V0IHN1cHBvcnQgZm9yXG4gKiBpdGVyYXRlZSBzaG9ydGhhbmRzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBbYXJyYXldIFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcmVkaWNhdGUgVGhlIGZ1bmN0aW9uIGludm9rZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGZpbHRlcmVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBhcnJheUZpbHRlcihhcnJheSwgcHJlZGljYXRlKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gYXJyYXkgPT0gbnVsbCA/IDAgOiBhcnJheS5sZW5ndGgsXG4gICAgICByZXNJbmRleCA9IDAsXG4gICAgICByZXN1bHQgPSBbXTtcblxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IGFycmF5W2luZGV4XTtcbiAgICBpZiAocHJlZGljYXRlKHZhbHVlLCBpbmRleCwgYXJyYXkpKSB7XG4gICAgICByZXN1bHRbcmVzSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhcnJheUZpbHRlcjtcbiIsIi8qKlxuICogVGhpcyBtZXRob2QgcmV0dXJucyBhIG5ldyBlbXB0eSBhcnJheS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMTMuMFxuICogQGNhdGVnb3J5IFV0aWxcbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgbmV3IGVtcHR5IGFycmF5LlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgYXJyYXlzID0gXy50aW1lcygyLCBfLnN0dWJBcnJheSk7XG4gKlxuICogY29uc29sZS5sb2coYXJyYXlzKTtcbiAqIC8vID0+IFtbXSwgW11dXG4gKlxuICogY29uc29sZS5sb2coYXJyYXlzWzBdID09PSBhcnJheXNbMV0pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gc3R1YkFycmF5KCkge1xuICByZXR1cm4gW107XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3R1YkFycmF5O1xuIiwidmFyIGFycmF5RmlsdGVyID0gcmVxdWlyZSgnLi9fYXJyYXlGaWx0ZXInKSxcbiAgICBzdHViQXJyYXkgPSByZXF1aXJlKCcuL3N0dWJBcnJheScpO1xuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBwcm9wZXJ0eUlzRW51bWVyYWJsZSA9IG9iamVjdFByb3RvLnByb3BlcnR5SXNFbnVtZXJhYmxlO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyBmb3IgdGhvc2Ugd2l0aCB0aGUgc2FtZSBuYW1lIGFzIG90aGVyIGBsb2Rhc2hgIG1ldGhvZHMuICovXG52YXIgbmF0aXZlR2V0U3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHM7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiB0aGUgb3duIGVudW1lcmFibGUgc3ltYm9scyBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBzeW1ib2xzLlxuICovXG52YXIgZ2V0U3ltYm9scyA9ICFuYXRpdmVHZXRTeW1ib2xzID8gc3R1YkFycmF5IDogZnVuY3Rpb24ob2JqZWN0KSB7XG4gIGlmIChvYmplY3QgPT0gbnVsbCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBvYmplY3QgPSBPYmplY3Qob2JqZWN0KTtcbiAgcmV0dXJuIGFycmF5RmlsdGVyKG5hdGl2ZUdldFN5bWJvbHMob2JqZWN0KSwgZnVuY3Rpb24oc3ltYm9sKSB7XG4gICAgcmV0dXJuIHByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqZWN0LCBzeW1ib2wpO1xuICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0U3ltYm9scztcbiIsInZhciBiYXNlR2V0QWxsS2V5cyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRBbGxLZXlzJyksXG4gICAgZ2V0U3ltYm9scyA9IHJlcXVpcmUoJy4vX2dldFN5bWJvbHMnKSxcbiAgICBrZXlzID0gcmVxdWlyZSgnLi9rZXlzJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBhcnJheSBvZiBvd24gZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lcyBhbmQgc3ltYm9scyBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcyBhbmQgc3ltYm9scy5cbiAqL1xuZnVuY3Rpb24gZ2V0QWxsS2V5cyhvYmplY3QpIHtcbiAgcmV0dXJuIGJhc2VHZXRBbGxLZXlzKG9iamVjdCwga2V5cywgZ2V0U3ltYm9scyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0QWxsS2V5cztcbiIsInZhciBnZXRBbGxLZXlzID0gcmVxdWlyZSgnLi9fZ2V0QWxsS2V5cycpO1xuXG4vKiogVXNlZCB0byBjb21wb3NlIGJpdG1hc2tzIGZvciB2YWx1ZSBjb21wYXJpc29ucy4gKi9cbnZhciBDT01QQVJFX1BBUlRJQUxfRkxBRyA9IDE7XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogQSBzcGVjaWFsaXplZCB2ZXJzaW9uIG9mIGBiYXNlSXNFcXVhbERlZXBgIGZvciBvYmplY3RzIHdpdGggc3VwcG9ydCBmb3JcbiAqIHBhcnRpYWwgZGVlcCBjb21wYXJpc29ucy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge09iamVjdH0gb3RoZXIgVGhlIG90aGVyIG9iamVjdCB0byBjb21wYXJlLlxuICogQHBhcmFtIHtudW1iZXJ9IGJpdG1hc2sgVGhlIGJpdG1hc2sgZmxhZ3MuIFNlZSBgYmFzZUlzRXF1YWxgIGZvciBtb3JlIGRldGFpbHMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjdXN0b21pemVyIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBlcXVhbEZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGRldGVybWluZSBlcXVpdmFsZW50cyBvZiB2YWx1ZXMuXG4gKiBAcGFyYW0ge09iamVjdH0gc3RhY2sgVHJhY2tzIHRyYXZlcnNlZCBgb2JqZWN0YCBhbmQgYG90aGVyYCBvYmplY3RzLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBvYmplY3RzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGVxdWFsT2JqZWN0cyhvYmplY3QsIG90aGVyLCBiaXRtYXNrLCBjdXN0b21pemVyLCBlcXVhbEZ1bmMsIHN0YWNrKSB7XG4gIHZhciBpc1BhcnRpYWwgPSBiaXRtYXNrICYgQ09NUEFSRV9QQVJUSUFMX0ZMQUcsXG4gICAgICBvYmpQcm9wcyA9IGdldEFsbEtleXMob2JqZWN0KSxcbiAgICAgIG9iakxlbmd0aCA9IG9ialByb3BzLmxlbmd0aCxcbiAgICAgIG90aFByb3BzID0gZ2V0QWxsS2V5cyhvdGhlciksXG4gICAgICBvdGhMZW5ndGggPSBvdGhQcm9wcy5sZW5ndGg7XG5cbiAgaWYgKG9iakxlbmd0aCAhPSBvdGhMZW5ndGggJiYgIWlzUGFydGlhbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgaW5kZXggPSBvYmpMZW5ndGg7XG4gIHdoaWxlIChpbmRleC0tKSB7XG4gICAgdmFyIGtleSA9IG9ialByb3BzW2luZGV4XTtcbiAgICBpZiAoIShpc1BhcnRpYWwgPyBrZXkgaW4gb3RoZXIgOiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG90aGVyLCBrZXkpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICAvLyBDaGVjayB0aGF0IGN5Y2xpYyB2YWx1ZXMgYXJlIGVxdWFsLlxuICB2YXIgb2JqU3RhY2tlZCA9IHN0YWNrLmdldChvYmplY3QpO1xuICB2YXIgb3RoU3RhY2tlZCA9IHN0YWNrLmdldChvdGhlcik7XG4gIGlmIChvYmpTdGFja2VkICYmIG90aFN0YWNrZWQpIHtcbiAgICByZXR1cm4gb2JqU3RhY2tlZCA9PSBvdGhlciAmJiBvdGhTdGFja2VkID09IG9iamVjdDtcbiAgfVxuICB2YXIgcmVzdWx0ID0gdHJ1ZTtcbiAgc3RhY2suc2V0KG9iamVjdCwgb3RoZXIpO1xuICBzdGFjay5zZXQob3RoZXIsIG9iamVjdCk7XG5cbiAgdmFyIHNraXBDdG9yID0gaXNQYXJ0aWFsO1xuICB3aGlsZSAoKytpbmRleCA8IG9iakxlbmd0aCkge1xuICAgIGtleSA9IG9ialByb3BzW2luZGV4XTtcbiAgICB2YXIgb2JqVmFsdWUgPSBvYmplY3Rba2V5XSxcbiAgICAgICAgb3RoVmFsdWUgPSBvdGhlcltrZXldO1xuXG4gICAgaWYgKGN1c3RvbWl6ZXIpIHtcbiAgICAgIHZhciBjb21wYXJlZCA9IGlzUGFydGlhbFxuICAgICAgICA/IGN1c3RvbWl6ZXIob3RoVmFsdWUsIG9ialZhbHVlLCBrZXksIG90aGVyLCBvYmplY3QsIHN0YWNrKVxuICAgICAgICA6IGN1c3RvbWl6ZXIob2JqVmFsdWUsIG90aFZhbHVlLCBrZXksIG9iamVjdCwgb3RoZXIsIHN0YWNrKTtcbiAgICB9XG4gICAgLy8gUmVjdXJzaXZlbHkgY29tcGFyZSBvYmplY3RzIChzdXNjZXB0aWJsZSB0byBjYWxsIHN0YWNrIGxpbWl0cykuXG4gICAgaWYgKCEoY29tcGFyZWQgPT09IHVuZGVmaW5lZFxuICAgICAgICAgID8gKG9ialZhbHVlID09PSBvdGhWYWx1ZSB8fCBlcXVhbEZ1bmMob2JqVmFsdWUsIG90aFZhbHVlLCBiaXRtYXNrLCBjdXN0b21pemVyLCBzdGFjaykpXG4gICAgICAgICAgOiBjb21wYXJlZFxuICAgICAgICApKSB7XG4gICAgICByZXN1bHQgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBza2lwQ3RvciB8fCAoc2tpcEN0b3IgPSBrZXkgPT0gJ2NvbnN0cnVjdG9yJyk7XG4gIH1cbiAgaWYgKHJlc3VsdCAmJiAhc2tpcEN0b3IpIHtcbiAgICB2YXIgb2JqQ3RvciA9IG9iamVjdC5jb25zdHJ1Y3RvcixcbiAgICAgICAgb3RoQ3RvciA9IG90aGVyLmNvbnN0cnVjdG9yO1xuXG4gICAgLy8gTm9uIGBPYmplY3RgIG9iamVjdCBpbnN0YW5jZXMgd2l0aCBkaWZmZXJlbnQgY29uc3RydWN0b3JzIGFyZSBub3QgZXF1YWwuXG4gICAgaWYgKG9iakN0b3IgIT0gb3RoQ3RvciAmJlxuICAgICAgICAoJ2NvbnN0cnVjdG9yJyBpbiBvYmplY3QgJiYgJ2NvbnN0cnVjdG9yJyBpbiBvdGhlcikgJiZcbiAgICAgICAgISh0eXBlb2Ygb2JqQ3RvciA9PSAnZnVuY3Rpb24nICYmIG9iakN0b3IgaW5zdGFuY2VvZiBvYmpDdG9yICYmXG4gICAgICAgICAgdHlwZW9mIG90aEN0b3IgPT0gJ2Z1bmN0aW9uJyAmJiBvdGhDdG9yIGluc3RhbmNlb2Ygb3RoQ3RvcikpIHtcbiAgICAgIHJlc3VsdCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBzdGFja1snZGVsZXRlJ10ob2JqZWN0KTtcbiAgc3RhY2tbJ2RlbGV0ZSddKG90aGVyKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbE9iamVjdHM7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9fZ2V0TmF0aXZlJyksXG4gICAgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xudmFyIERhdGFWaWV3ID0gZ2V0TmF0aXZlKHJvb3QsICdEYXRhVmlldycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFWaWV3O1xuIiwidmFyIGdldE5hdGl2ZSA9IHJlcXVpcmUoJy4vX2dldE5hdGl2ZScpLFxuICAgIHJvb3QgPSByZXF1aXJlKCcuL19yb290Jyk7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbnZhciBQcm9taXNlID0gZ2V0TmF0aXZlKHJvb3QsICdQcm9taXNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcbiIsInZhciBnZXROYXRpdmUgPSByZXF1aXJlKCcuL19nZXROYXRpdmUnKSxcbiAgICByb290ID0gcmVxdWlyZSgnLi9fcm9vdCcpO1xuXG4vKiBCdWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcyB0aGF0IGFyZSB2ZXJpZmllZCB0byBiZSBuYXRpdmUuICovXG52YXIgU2V0ID0gZ2V0TmF0aXZlKHJvb3QsICdTZXQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZXQ7XG4iLCJ2YXIgZ2V0TmF0aXZlID0gcmVxdWlyZSgnLi9fZ2V0TmF0aXZlJyksXG4gICAgcm9vdCA9IHJlcXVpcmUoJy4vX3Jvb3QnKTtcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xudmFyIFdlYWtNYXAgPSBnZXROYXRpdmUocm9vdCwgJ1dlYWtNYXAnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWFrTWFwO1xuIiwidmFyIERhdGFWaWV3ID0gcmVxdWlyZSgnLi9fRGF0YVZpZXcnKSxcbiAgICBNYXAgPSByZXF1aXJlKCcuL19NYXAnKSxcbiAgICBQcm9taXNlID0gcmVxdWlyZSgnLi9fUHJvbWlzZScpLFxuICAgIFNldCA9IHJlcXVpcmUoJy4vX1NldCcpLFxuICAgIFdlYWtNYXAgPSByZXF1aXJlKCcuL19XZWFrTWFwJyksXG4gICAgYmFzZUdldFRhZyA9IHJlcXVpcmUoJy4vX2Jhc2VHZXRUYWcnKSxcbiAgICB0b1NvdXJjZSA9IHJlcXVpcmUoJy4vX3RvU291cmNlJyk7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBtYXBUYWcgPSAnW29iamVjdCBNYXBdJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJyxcbiAgICBwcm9taXNlVGFnID0gJ1tvYmplY3QgUHJvbWlzZV0nLFxuICAgIHNldFRhZyA9ICdbb2JqZWN0IFNldF0nLFxuICAgIHdlYWtNYXBUYWcgPSAnW29iamVjdCBXZWFrTWFwXSc7XG5cbnZhciBkYXRhVmlld1RhZyA9ICdbb2JqZWN0IERhdGFWaWV3XSc7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBtYXBzLCBzZXRzLCBhbmQgd2Vha21hcHMuICovXG52YXIgZGF0YVZpZXdDdG9yU3RyaW5nID0gdG9Tb3VyY2UoRGF0YVZpZXcpLFxuICAgIG1hcEN0b3JTdHJpbmcgPSB0b1NvdXJjZShNYXApLFxuICAgIHByb21pc2VDdG9yU3RyaW5nID0gdG9Tb3VyY2UoUHJvbWlzZSksXG4gICAgc2V0Q3RvclN0cmluZyA9IHRvU291cmNlKFNldCksXG4gICAgd2Vha01hcEN0b3JTdHJpbmcgPSB0b1NvdXJjZShXZWFrTWFwKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBgdG9TdHJpbmdUYWdgIG9mIGB2YWx1ZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHF1ZXJ5LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgYHRvU3RyaW5nVGFnYC5cbiAqL1xudmFyIGdldFRhZyA9IGJhc2VHZXRUYWc7XG5cbi8vIEZhbGxiYWNrIGZvciBkYXRhIHZpZXdzLCBtYXBzLCBzZXRzLCBhbmQgd2VhayBtYXBzIGluIElFIDExIGFuZCBwcm9taXNlcyBpbiBOb2RlLmpzIDwgNi5cbmlmICgoRGF0YVZpZXcgJiYgZ2V0VGFnKG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoMSkpKSAhPSBkYXRhVmlld1RhZykgfHxcbiAgICAoTWFwICYmIGdldFRhZyhuZXcgTWFwKSAhPSBtYXBUYWcpIHx8XG4gICAgKFByb21pc2UgJiYgZ2V0VGFnKFByb21pc2UucmVzb2x2ZSgpKSAhPSBwcm9taXNlVGFnKSB8fFxuICAgIChTZXQgJiYgZ2V0VGFnKG5ldyBTZXQpICE9IHNldFRhZykgfHxcbiAgICAoV2Vha01hcCAmJiBnZXRUYWcobmV3IFdlYWtNYXApICE9IHdlYWtNYXBUYWcpKSB7XG4gIGdldFRhZyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIHJlc3VsdCA9IGJhc2VHZXRUYWcodmFsdWUpLFxuICAgICAgICBDdG9yID0gcmVzdWx0ID09IG9iamVjdFRhZyA/IHZhbHVlLmNvbnN0cnVjdG9yIDogdW5kZWZpbmVkLFxuICAgICAgICBjdG9yU3RyaW5nID0gQ3RvciA/IHRvU291cmNlKEN0b3IpIDogJyc7XG5cbiAgICBpZiAoY3RvclN0cmluZykge1xuICAgICAgc3dpdGNoIChjdG9yU3RyaW5nKSB7XG4gICAgICAgIGNhc2UgZGF0YVZpZXdDdG9yU3RyaW5nOiByZXR1cm4gZGF0YVZpZXdUYWc7XG4gICAgICAgIGNhc2UgbWFwQ3RvclN0cmluZzogcmV0dXJuIG1hcFRhZztcbiAgICAgICAgY2FzZSBwcm9taXNlQ3RvclN0cmluZzogcmV0dXJuIHByb21pc2VUYWc7XG4gICAgICAgIGNhc2Ugc2V0Q3RvclN0cmluZzogcmV0dXJuIHNldFRhZztcbiAgICAgICAgY2FzZSB3ZWFrTWFwQ3RvclN0cmluZzogcmV0dXJuIHdlYWtNYXBUYWc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0VGFnO1xuIiwidmFyIFN0YWNrID0gcmVxdWlyZSgnLi9fU3RhY2snKSxcbiAgICBlcXVhbEFycmF5cyA9IHJlcXVpcmUoJy4vX2VxdWFsQXJyYXlzJyksXG4gICAgZXF1YWxCeVRhZyA9IHJlcXVpcmUoJy4vX2VxdWFsQnlUYWcnKSxcbiAgICBlcXVhbE9iamVjdHMgPSByZXF1aXJlKCcuL19lcXVhbE9iamVjdHMnKSxcbiAgICBnZXRUYWcgPSByZXF1aXJlKCcuL19nZXRUYWcnKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5JyksXG4gICAgaXNCdWZmZXIgPSByZXF1aXJlKCcuL2lzQnVmZmVyJyksXG4gICAgaXNUeXBlZEFycmF5ID0gcmVxdWlyZSgnLi9pc1R5cGVkQXJyYXknKTtcblxuLyoqIFVzZWQgdG8gY29tcG9zZSBiaXRtYXNrcyBmb3IgdmFsdWUgY29tcGFyaXNvbnMuICovXG52YXIgQ09NUEFSRV9QQVJUSUFMX0ZMQUcgPSAxO1xuXG4vKiogYE9iamVjdCN0b1N0cmluZ2AgcmVzdWx0IHJlZmVyZW5jZXMuICovXG52YXIgYXJnc1RhZyA9ICdbb2JqZWN0IEFyZ3VtZW50c10nLFxuICAgIGFycmF5VGFnID0gJ1tvYmplY3QgQXJyYXldJyxcbiAgICBvYmplY3RUYWcgPSAnW29iamVjdCBPYmplY3RdJztcblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gY2hlY2sgb2JqZWN0cyBmb3Igb3duIHByb3BlcnRpZXMuICovXG52YXIgaGFzT3duUHJvcGVydHkgPSBvYmplY3RQcm90by5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VJc0VxdWFsYCBmb3IgYXJyYXlzIGFuZCBvYmplY3RzIHdoaWNoIHBlcmZvcm1zXG4gKiBkZWVwIGNvbXBhcmlzb25zIGFuZCB0cmFja3MgdHJhdmVyc2VkIG9iamVjdHMgZW5hYmxpbmcgb2JqZWN0cyB3aXRoIGNpcmN1bGFyXG4gKiByZWZlcmVuY2VzIHRvIGJlIGNvbXBhcmVkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvdGhlciBUaGUgb3RoZXIgb2JqZWN0IHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge251bWJlcn0gYml0bWFzayBUaGUgYml0bWFzayBmbGFncy4gU2VlIGBiYXNlSXNFcXVhbGAgZm9yIG1vcmUgZGV0YWlscy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGN1c3RvbWl6ZXIgVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpc29ucy5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVxdWFsRnVuYyBUaGUgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIGVxdWl2YWxlbnRzIG9mIHZhbHVlcy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbc3RhY2tdIFRyYWNrcyB0cmF2ZXJzZWQgYG9iamVjdGAgYW5kIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgb2JqZWN0cyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBiYXNlSXNFcXVhbERlZXAob2JqZWN0LCBvdGhlciwgYml0bWFzaywgY3VzdG9taXplciwgZXF1YWxGdW5jLCBzdGFjaykge1xuICB2YXIgb2JqSXNBcnIgPSBpc0FycmF5KG9iamVjdCksXG4gICAgICBvdGhJc0FyciA9IGlzQXJyYXkob3RoZXIpLFxuICAgICAgb2JqVGFnID0gb2JqSXNBcnIgPyBhcnJheVRhZyA6IGdldFRhZyhvYmplY3QpLFxuICAgICAgb3RoVGFnID0gb3RoSXNBcnIgPyBhcnJheVRhZyA6IGdldFRhZyhvdGhlcik7XG5cbiAgb2JqVGFnID0gb2JqVGFnID09IGFyZ3NUYWcgPyBvYmplY3RUYWcgOiBvYmpUYWc7XG4gIG90aFRhZyA9IG90aFRhZyA9PSBhcmdzVGFnID8gb2JqZWN0VGFnIDogb3RoVGFnO1xuXG4gIHZhciBvYmpJc09iaiA9IG9ialRhZyA9PSBvYmplY3RUYWcsXG4gICAgICBvdGhJc09iaiA9IG90aFRhZyA9PSBvYmplY3RUYWcsXG4gICAgICBpc1NhbWVUYWcgPSBvYmpUYWcgPT0gb3RoVGFnO1xuXG4gIGlmIChpc1NhbWVUYWcgJiYgaXNCdWZmZXIob2JqZWN0KSkge1xuICAgIGlmICghaXNCdWZmZXIob3RoZXIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIG9iaklzQXJyID0gdHJ1ZTtcbiAgICBvYmpJc09iaiA9IGZhbHNlO1xuICB9XG4gIGlmIChpc1NhbWVUYWcgJiYgIW9iaklzT2JqKSB7XG4gICAgc3RhY2sgfHwgKHN0YWNrID0gbmV3IFN0YWNrKTtcbiAgICByZXR1cm4gKG9iaklzQXJyIHx8IGlzVHlwZWRBcnJheShvYmplY3QpKVxuICAgICAgPyBlcXVhbEFycmF5cyhvYmplY3QsIG90aGVyLCBiaXRtYXNrLCBjdXN0b21pemVyLCBlcXVhbEZ1bmMsIHN0YWNrKVxuICAgICAgOiBlcXVhbEJ5VGFnKG9iamVjdCwgb3RoZXIsIG9ialRhZywgYml0bWFzaywgY3VzdG9taXplciwgZXF1YWxGdW5jLCBzdGFjayk7XG4gIH1cbiAgaWYgKCEoYml0bWFzayAmIENPTVBBUkVfUEFSVElBTF9GTEFHKSkge1xuICAgIHZhciBvYmpJc1dyYXBwZWQgPSBvYmpJc09iaiAmJiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgJ19fd3JhcHBlZF9fJyksXG4gICAgICAgIG90aElzV3JhcHBlZCA9IG90aElzT2JqICYmIGhhc093blByb3BlcnR5LmNhbGwob3RoZXIsICdfX3dyYXBwZWRfXycpO1xuXG4gICAgaWYgKG9iaklzV3JhcHBlZCB8fCBvdGhJc1dyYXBwZWQpIHtcbiAgICAgIHZhciBvYmpVbndyYXBwZWQgPSBvYmpJc1dyYXBwZWQgPyBvYmplY3QudmFsdWUoKSA6IG9iamVjdCxcbiAgICAgICAgICBvdGhVbndyYXBwZWQgPSBvdGhJc1dyYXBwZWQgPyBvdGhlci52YWx1ZSgpIDogb3RoZXI7XG5cbiAgICAgIHN0YWNrIHx8IChzdGFjayA9IG5ldyBTdGFjayk7XG4gICAgICByZXR1cm4gZXF1YWxGdW5jKG9ialVud3JhcHBlZCwgb3RoVW53cmFwcGVkLCBiaXRtYXNrLCBjdXN0b21pemVyLCBzdGFjayk7XG4gICAgfVxuICB9XG4gIGlmICghaXNTYW1lVGFnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHN0YWNrIHx8IChzdGFjayA9IG5ldyBTdGFjayk7XG4gIHJldHVybiBlcXVhbE9iamVjdHMob2JqZWN0LCBvdGhlciwgYml0bWFzaywgY3VzdG9taXplciwgZXF1YWxGdW5jLCBzdGFjayk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUlzRXF1YWxEZWVwO1xuIiwidmFyIGJhc2VJc0VxdWFsRGVlcCA9IHJlcXVpcmUoJy4vX2Jhc2VJc0VxdWFsRGVlcCcpLFxuICAgIGlzT2JqZWN0TGlrZSA9IHJlcXVpcmUoJy4vaXNPYmplY3RMaWtlJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXNFcXVhbGAgd2hpY2ggc3VwcG9ydHMgcGFydGlhbCBjb21wYXJpc29uc1xuICogYW5kIHRyYWNrcyB0cmF2ZXJzZWQgb2JqZWN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGJpdG1hc2sgVGhlIGJpdG1hc2sgZmxhZ3MuXG4gKiAgMSAtIFVub3JkZXJlZCBjb21wYXJpc29uXG4gKiAgMiAtIFBhcnRpYWwgY29tcGFyaXNvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2N1c3RvbWl6ZXJdIFRoZSBmdW5jdGlvbiB0byBjdXN0b21pemUgY29tcGFyaXNvbnMuXG4gKiBAcGFyYW0ge09iamVjdH0gW3N0YWNrXSBUcmFja3MgdHJhdmVyc2VkIGB2YWx1ZWAgYW5kIGBvdGhlcmAgb2JqZWN0cy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc0VxdWFsKHZhbHVlLCBvdGhlciwgYml0bWFzaywgY3VzdG9taXplciwgc3RhY2spIHtcbiAgaWYgKHZhbHVlID09PSBvdGhlcikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmICh2YWx1ZSA9PSBudWxsIHx8IG90aGVyID09IG51bGwgfHwgKCFpc09iamVjdExpa2UodmFsdWUpICYmICFpc09iamVjdExpa2Uob3RoZXIpKSkge1xuICAgIHJldHVybiB2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyO1xuICB9XG4gIHJldHVybiBiYXNlSXNFcXVhbERlZXAodmFsdWUsIG90aGVyLCBiaXRtYXNrLCBjdXN0b21pemVyLCBiYXNlSXNFcXVhbCwgc3RhY2spO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc0VxdWFsO1xuIiwidmFyIFN0YWNrID0gcmVxdWlyZSgnLi9fU3RhY2snKSxcbiAgICBiYXNlSXNFcXVhbCA9IHJlcXVpcmUoJy4vX2Jhc2VJc0VxdWFsJyk7XG5cbi8qKiBVc2VkIHRvIGNvbXBvc2UgYml0bWFza3MgZm9yIHZhbHVlIGNvbXBhcmlzb25zLiAqL1xudmFyIENPTVBBUkVfUEFSVElBTF9GTEFHID0gMSxcbiAgICBDT01QQVJFX1VOT1JERVJFRF9GTEFHID0gMjtcblxuLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5pc01hdGNoYCB3aXRob3V0IHN1cHBvcnQgZm9yIGl0ZXJhdGVlIHNob3J0aGFuZHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBpbnNwZWN0LlxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IG9mIHByb3BlcnR5IHZhbHVlcyB0byBtYXRjaC5cbiAqIEBwYXJhbSB7QXJyYXl9IG1hdGNoRGF0YSBUaGUgcHJvcGVydHkgbmFtZXMsIHZhbHVlcywgYW5kIGNvbXBhcmUgZmxhZ3MgdG8gbWF0Y2guXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBbY3VzdG9taXplcl0gVGhlIGZ1bmN0aW9uIHRvIGN1c3RvbWl6ZSBjb21wYXJpc29ucy5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgb2JqZWN0YCBpcyBhIG1hdGNoLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc01hdGNoKG9iamVjdCwgc291cmNlLCBtYXRjaERhdGEsIGN1c3RvbWl6ZXIpIHtcbiAgdmFyIGluZGV4ID0gbWF0Y2hEYXRhLmxlbmd0aCxcbiAgICAgIGxlbmd0aCA9IGluZGV4LFxuICAgICAgbm9DdXN0b21pemVyID0gIWN1c3RvbWl6ZXI7XG5cbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuICFsZW5ndGg7XG4gIH1cbiAgb2JqZWN0ID0gT2JqZWN0KG9iamVjdCk7XG4gIHdoaWxlIChpbmRleC0tKSB7XG4gICAgdmFyIGRhdGEgPSBtYXRjaERhdGFbaW5kZXhdO1xuICAgIGlmICgobm9DdXN0b21pemVyICYmIGRhdGFbMl0pXG4gICAgICAgICAgPyBkYXRhWzFdICE9PSBvYmplY3RbZGF0YVswXV1cbiAgICAgICAgICA6ICEoZGF0YVswXSBpbiBvYmplY3QpXG4gICAgICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIGRhdGEgPSBtYXRjaERhdGFbaW5kZXhdO1xuICAgIHZhciBrZXkgPSBkYXRhWzBdLFxuICAgICAgICBvYmpWYWx1ZSA9IG9iamVjdFtrZXldLFxuICAgICAgICBzcmNWYWx1ZSA9IGRhdGFbMV07XG5cbiAgICBpZiAobm9DdXN0b21pemVyICYmIGRhdGFbMl0pIHtcbiAgICAgIGlmIChvYmpWYWx1ZSA9PT0gdW5kZWZpbmVkICYmICEoa2V5IGluIG9iamVjdCkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgc3RhY2sgPSBuZXcgU3RhY2s7XG4gICAgICBpZiAoY3VzdG9taXplcikge1xuICAgICAgICB2YXIgcmVzdWx0ID0gY3VzdG9taXplcihvYmpWYWx1ZSwgc3JjVmFsdWUsIGtleSwgb2JqZWN0LCBzb3VyY2UsIHN0YWNrKTtcbiAgICAgIH1cbiAgICAgIGlmICghKHJlc3VsdCA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGJhc2VJc0VxdWFsKHNyY1ZhbHVlLCBvYmpWYWx1ZSwgQ09NUEFSRV9QQVJUSUFMX0ZMQUcgfCBDT01QQVJFX1VOT1JERVJFRF9GTEFHLCBjdXN0b21pemVyLCBzdGFjaylcbiAgICAgICAgICAgIDogcmVzdWx0XG4gICAgICAgICAgKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJc01hdGNoO1xuIiwidmFyIGlzT2JqZWN0ID0gcmVxdWlyZSgnLi9pc09iamVjdCcpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlIGZvciBzdHJpY3QgZXF1YWxpdHkgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaWYgc3VpdGFibGUgZm9yIHN0cmljdFxuICogIGVxdWFsaXR5IGNvbXBhcmlzb25zLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzU3RyaWN0Q29tcGFyYWJsZSh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT09IHZhbHVlICYmICFpc09iamVjdCh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaXNTdHJpY3RDb21wYXJhYmxlO1xuIiwidmFyIGlzU3RyaWN0Q29tcGFyYWJsZSA9IHJlcXVpcmUoJy4vX2lzU3RyaWN0Q29tcGFyYWJsZScpLFxuICAgIGtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcblxuLyoqXG4gKiBHZXRzIHRoZSBwcm9wZXJ0eSBuYW1lcywgdmFsdWVzLCBhbmQgY29tcGFyZSBmbGFncyBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBtYXRjaCBkYXRhIG9mIGBvYmplY3RgLlxuICovXG5mdW5jdGlvbiBnZXRNYXRjaERhdGEob2JqZWN0KSB7XG4gIHZhciByZXN1bHQgPSBrZXlzKG9iamVjdCksXG4gICAgICBsZW5ndGggPSByZXN1bHQubGVuZ3RoO1xuXG4gIHdoaWxlIChsZW5ndGgtLSkge1xuICAgIHZhciBrZXkgPSByZXN1bHRbbGVuZ3RoXSxcbiAgICAgICAgdmFsdWUgPSBvYmplY3Rba2V5XTtcblxuICAgIHJlc3VsdFtsZW5ndGhdID0gW2tleSwgdmFsdWUsIGlzU3RyaWN0Q29tcGFyYWJsZSh2YWx1ZSldO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0TWF0Y2hEYXRhO1xuIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYG1hdGNoZXNQcm9wZXJ0eWAgZm9yIHNvdXJjZSB2YWx1ZXMgc3VpdGFibGVcbiAqIGZvciBzdHJpY3QgZXF1YWxpdHkgY29tcGFyaXNvbnMsIGkuZS4gYD09PWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHBhcmFtIHsqfSBzcmNWYWx1ZSBUaGUgdmFsdWUgdG8gbWF0Y2guXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBzcGVjIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBtYXRjaGVzU3RyaWN0Q29tcGFyYWJsZShrZXksIHNyY1ZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdFtrZXldID09PSBzcmNWYWx1ZSAmJlxuICAgICAgKHNyY1ZhbHVlICE9PSB1bmRlZmluZWQgfHwgKGtleSBpbiBPYmplY3Qob2JqZWN0KSkpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoZXNTdHJpY3RDb21wYXJhYmxlO1xuIiwidmFyIGJhc2VJc01hdGNoID0gcmVxdWlyZSgnLi9fYmFzZUlzTWF0Y2gnKSxcbiAgICBnZXRNYXRjaERhdGEgPSByZXF1aXJlKCcuL19nZXRNYXRjaERhdGEnKSxcbiAgICBtYXRjaGVzU3RyaWN0Q29tcGFyYWJsZSA9IHJlcXVpcmUoJy4vX21hdGNoZXNTdHJpY3RDb21wYXJhYmxlJyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8ubWF0Y2hlc2Agd2hpY2ggZG9lc24ndCBjbG9uZSBgc291cmNlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IHNvdXJjZSBUaGUgb2JqZWN0IG9mIHByb3BlcnR5IHZhbHVlcyB0byBtYXRjaC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IHNwZWMgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGJhc2VNYXRjaGVzKHNvdXJjZSkge1xuICB2YXIgbWF0Y2hEYXRhID0gZ2V0TWF0Y2hEYXRhKHNvdXJjZSk7XG4gIGlmIChtYXRjaERhdGEubGVuZ3RoID09IDEgJiYgbWF0Y2hEYXRhWzBdWzJdKSB7XG4gICAgcmV0dXJuIG1hdGNoZXNTdHJpY3RDb21wYXJhYmxlKG1hdGNoRGF0YVswXVswXSwgbWF0Y2hEYXRhWzBdWzFdKTtcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCA9PT0gc291cmNlIHx8IGJhc2VJc01hdGNoKG9iamVjdCwgc291cmNlLCBtYXRjaERhdGEpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VNYXRjaGVzO1xuIiwidmFyIGNhc3RQYXRoID0gcmVxdWlyZSgnLi9fY2FzdFBhdGgnKSxcbiAgICB0b0tleSA9IHJlcXVpcmUoJy4vX3RvS2V5Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uZ2V0YCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICovXG5mdW5jdGlvbiBiYXNlR2V0KG9iamVjdCwgcGF0aCkge1xuICBwYXRoID0gY2FzdFBhdGgocGF0aCwgb2JqZWN0KTtcblxuICB2YXIgaW5kZXggPSAwLFxuICAgICAgbGVuZ3RoID0gcGF0aC5sZW5ndGg7XG5cbiAgd2hpbGUgKG9iamVjdCAhPSBudWxsICYmIGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgb2JqZWN0ID0gb2JqZWN0W3RvS2V5KHBhdGhbaW5kZXgrK10pXTtcbiAgfVxuICByZXR1cm4gKGluZGV4ICYmIGluZGV4ID09IGxlbmd0aCkgPyBvYmplY3QgOiB1bmRlZmluZWQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUdldDtcbiIsInZhciBiYXNlR2V0ID0gcmVxdWlyZSgnLi9fYmFzZUdldCcpO1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIGF0IGBwYXRoYCBvZiBgb2JqZWN0YC4gSWYgdGhlIHJlc29sdmVkIHZhbHVlIGlzXG4gKiBgdW5kZWZpbmVkYCwgdGhlIGBkZWZhdWx0VmFsdWVgIGlzIHJldHVybmVkIGluIGl0cyBwbGFjZS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDMuNy4wXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqZWN0IFRoZSBvYmplY3QgdG8gcXVlcnkuXG4gKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHBhcmFtIHsqfSBbZGVmYXVsdFZhbHVlXSBUaGUgdmFsdWUgcmV0dXJuZWQgZm9yIGB1bmRlZmluZWRgIHJlc29sdmVkIHZhbHVlcy5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSByZXNvbHZlZCB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKlxuICogdmFyIG9iamVjdCA9IHsgJ2EnOiBbeyAnYic6IHsgJ2MnOiAzIH0gfV0gfTtcbiAqXG4gKiBfLmdldChvYmplY3QsICdhWzBdLmIuYycpO1xuICogLy8gPT4gM1xuICpcbiAqIF8uZ2V0KG9iamVjdCwgWydhJywgJzAnLCAnYicsICdjJ10pO1xuICogLy8gPT4gM1xuICpcbiAqIF8uZ2V0KG9iamVjdCwgJ2EuYi5jJywgJ2RlZmF1bHQnKTtcbiAqIC8vID0+ICdkZWZhdWx0J1xuICovXG5mdW5jdGlvbiBnZXQob2JqZWN0LCBwYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgdmFyIHJlc3VsdCA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogYmFzZUdldChvYmplY3QsIHBhdGgpO1xuICByZXR1cm4gcmVzdWx0ID09PSB1bmRlZmluZWQgPyBkZWZhdWx0VmFsdWUgOiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0O1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5oYXNJbmAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7QXJyYXl8c3RyaW5nfSBrZXkgVGhlIGtleSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gYmFzZUhhc0luKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiBrZXkgaW4gT2JqZWN0KG9iamVjdCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUhhc0luO1xuIiwidmFyIGJhc2VIYXNJbiA9IHJlcXVpcmUoJy4vX2Jhc2VIYXNJbicpLFxuICAgIGhhc1BhdGggPSByZXF1aXJlKCcuL19oYXNQYXRoJyk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGBwYXRoYCBpcyBhIGRpcmVjdCBvciBpbmhlcml0ZWQgcHJvcGVydHkgb2YgYG9iamVjdGAuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHBhdGhgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0gXy5jcmVhdGUoeyAnYSc6IF8uY3JlYXRlKHsgJ2InOiAyIH0pIH0pO1xuICpcbiAqIF8uaGFzSW4ob2JqZWN0LCAnYScpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaGFzSW4ob2JqZWN0LCAnYS5iJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5oYXNJbihvYmplY3QsIFsnYScsICdiJ10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaGFzSW4ob2JqZWN0LCAnYicpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaGFzSW4ob2JqZWN0LCBwYXRoKSB7XG4gIHJldHVybiBvYmplY3QgIT0gbnVsbCAmJiBoYXNQYXRoKG9iamVjdCwgcGF0aCwgYmFzZUhhc0luKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoYXNJbjtcbiIsInZhciBiYXNlSXNFcXVhbCA9IHJlcXVpcmUoJy4vX2Jhc2VJc0VxdWFsJyksXG4gICAgZ2V0ID0gcmVxdWlyZSgnLi9nZXQnKSxcbiAgICBoYXNJbiA9IHJlcXVpcmUoJy4vaGFzSW4nKSxcbiAgICBpc0tleSA9IHJlcXVpcmUoJy4vX2lzS2V5JyksXG4gICAgaXNTdHJpY3RDb21wYXJhYmxlID0gcmVxdWlyZSgnLi9faXNTdHJpY3RDb21wYXJhYmxlJyksXG4gICAgbWF0Y2hlc1N0cmljdENvbXBhcmFibGUgPSByZXF1aXJlKCcuL19tYXRjaGVzU3RyaWN0Q29tcGFyYWJsZScpLFxuICAgIHRvS2V5ID0gcmVxdWlyZSgnLi9fdG9LZXknKTtcblxuLyoqIFVzZWQgdG8gY29tcG9zZSBiaXRtYXNrcyBmb3IgdmFsdWUgY29tcGFyaXNvbnMuICovXG52YXIgQ09NUEFSRV9QQVJUSUFMX0ZMQUcgPSAxLFxuICAgIENPTVBBUkVfVU5PUkRFUkVEX0ZMQUcgPSAyO1xuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLm1hdGNoZXNQcm9wZXJ0eWAgd2hpY2ggZG9lc24ndCBjbG9uZSBgc3JjVmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHBhcmFtIHsqfSBzcmNWYWx1ZSBUaGUgdmFsdWUgdG8gbWF0Y2guXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFJldHVybnMgdGhlIG5ldyBzcGVjIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlTWF0Y2hlc1Byb3BlcnR5KHBhdGgsIHNyY1ZhbHVlKSB7XG4gIGlmIChpc0tleShwYXRoKSAmJiBpc1N0cmljdENvbXBhcmFibGUoc3JjVmFsdWUpKSB7XG4gICAgcmV0dXJuIG1hdGNoZXNTdHJpY3RDb21wYXJhYmxlKHRvS2V5KHBhdGgpLCBzcmNWYWx1ZSk7XG4gIH1cbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHZhciBvYmpWYWx1ZSA9IGdldChvYmplY3QsIHBhdGgpO1xuICAgIHJldHVybiAob2JqVmFsdWUgPT09IHVuZGVmaW5lZCAmJiBvYmpWYWx1ZSA9PT0gc3JjVmFsdWUpXG4gICAgICA/IGhhc0luKG9iamVjdCwgcGF0aClcbiAgICAgIDogYmFzZUlzRXF1YWwoc3JjVmFsdWUsIG9ialZhbHVlLCBDT01QQVJFX1BBUlRJQUxfRkxBRyB8IENPTVBBUkVfVU5PUkRFUkVEX0ZMQUcpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VNYXRjaGVzUHJvcGVydHk7XG4iLCIvKipcbiAqIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGZpcnN0IGFyZ3VtZW50IGl0IHJlY2VpdmVzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBzaW5jZSAwLjEuMFxuICogQG1lbWJlck9mIF9cbiAqIEBjYXRlZ29yeSBVdGlsXG4gKiBAcGFyYW0geyp9IHZhbHVlIEFueSB2YWx1ZS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIGB2YWx1ZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3QgPSB7ICdhJzogMSB9O1xuICpcbiAqIGNvbnNvbGUubG9nKF8uaWRlbnRpdHkob2JqZWN0KSA9PT0gb2JqZWN0KTtcbiAqIC8vID0+IHRydWVcbiAqL1xuZnVuY3Rpb24gaWRlbnRpdHkodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGlkZW50aXR5O1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eWAgd2l0aG91dCBzdXBwb3J0IGZvciBkZWVwIHBhdGhzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGFjY2Vzc29yIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHkoa2V5KSB7XG4gIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiYXNlUHJvcGVydHk7XG4iLCJ2YXIgYmFzZUdldCA9IHJlcXVpcmUoJy4vX2Jhc2VHZXQnKTtcblxuLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYGJhc2VQcm9wZXJ0eWAgd2hpY2ggc3VwcG9ydHMgZGVlcCBwYXRocy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIGdldC5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGFjY2Vzc29yIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHlEZWVwKHBhdGgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiBiYXNlR2V0KG9iamVjdCwgcGF0aCk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVByb3BlcnR5RGVlcDtcbiIsInZhciBiYXNlUHJvcGVydHkgPSByZXF1aXJlKCcuL19iYXNlUHJvcGVydHknKSxcbiAgICBiYXNlUHJvcGVydHlEZWVwID0gcmVxdWlyZSgnLi9fYmFzZVByb3BlcnR5RGVlcCcpLFxuICAgIGlzS2V5ID0gcmVxdWlyZSgnLi9faXNLZXknKSxcbiAgICB0b0tleSA9IHJlcXVpcmUoJy4vX3RvS2V5Jyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgYXQgYHBhdGhgIG9mIGEgZ2l2ZW4gb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMi40LjBcbiAqIEBjYXRlZ29yeSBVdGlsXG4gKiBAcGFyYW0ge0FycmF5fHN0cmluZ30gcGF0aCBUaGUgcGF0aCBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgYWNjZXNzb3IgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqIHZhciBvYmplY3RzID0gW1xuICogICB7ICdhJzogeyAnYic6IDIgfSB9LFxuICogICB7ICdhJzogeyAnYic6IDEgfSB9XG4gKiBdO1xuICpcbiAqIF8ubWFwKG9iamVjdHMsIF8ucHJvcGVydHkoJ2EuYicpKTtcbiAqIC8vID0+IFsyLCAxXVxuICpcbiAqIF8ubWFwKF8uc29ydEJ5KG9iamVjdHMsIF8ucHJvcGVydHkoWydhJywgJ2InXSkpLCAnYS5iJyk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqL1xuZnVuY3Rpb24gcHJvcGVydHkocGF0aCkge1xuICByZXR1cm4gaXNLZXkocGF0aCkgPyBiYXNlUHJvcGVydHkodG9LZXkocGF0aCkpIDogYmFzZVByb3BlcnR5RGVlcChwYXRoKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwcm9wZXJ0eTtcbiIsInZhciBiYXNlTWF0Y2hlcyA9IHJlcXVpcmUoJy4vX2Jhc2VNYXRjaGVzJyksXG4gICAgYmFzZU1hdGNoZXNQcm9wZXJ0eSA9IHJlcXVpcmUoJy4vX2Jhc2VNYXRjaGVzUHJvcGVydHknKSxcbiAgICBpZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKSxcbiAgICBpc0FycmF5ID0gcmVxdWlyZSgnLi9pc0FycmF5JyksXG4gICAgcHJvcGVydHkgPSByZXF1aXJlKCcuL3Byb3BlcnR5Jyk7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8uaXRlcmF0ZWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IFt2YWx1ZT1fLmlkZW50aXR5XSBUaGUgdmFsdWUgdG8gY29udmVydCB0byBhbiBpdGVyYXRlZS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgaXRlcmF0ZWUuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJdGVyYXRlZSh2YWx1ZSkge1xuICAvLyBEb24ndCBzdG9yZSB0aGUgYHR5cGVvZmAgcmVzdWx0IGluIGEgdmFyaWFibGUgdG8gYXZvaWQgYSBKSVQgYnVnIGluIFNhZmFyaSA5LlxuICAvLyBTZWUgaHR0cHM6Ly9idWdzLndlYmtpdC5vcmcvc2hvd19idWcuY2dpP2lkPTE1NjAzNCBmb3IgbW9yZSBkZXRhaWxzLlxuICBpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICByZXR1cm4gaWRlbnRpdHk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBpc0FycmF5KHZhbHVlKVxuICAgICAgPyBiYXNlTWF0Y2hlc1Byb3BlcnR5KHZhbHVlWzBdLCB2YWx1ZVsxXSlcbiAgICAgIDogYmFzZU1hdGNoZXModmFsdWUpO1xuICB9XG4gIHJldHVybiBwcm9wZXJ0eSh2YWx1ZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZUl0ZXJhdGVlO1xuIiwidmFyIGJhc2VBc3NpZ25WYWx1ZSA9IHJlcXVpcmUoJy4vX2Jhc2VBc3NpZ25WYWx1ZScpLFxuICAgIGJhc2VGb3JPd24gPSByZXF1aXJlKCcuL19iYXNlRm9yT3duJyksXG4gICAgYmFzZUl0ZXJhdGVlID0gcmVxdWlyZSgnLi9fYmFzZUl0ZXJhdGVlJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBvYmplY3Qgd2l0aCB0aGUgc2FtZSBrZXlzIGFzIGBvYmplY3RgIGFuZCB2YWx1ZXMgZ2VuZXJhdGVkXG4gKiBieSBydW5uaW5nIGVhY2ggb3duIGVudW1lcmFibGUgc3RyaW5nIGtleWVkIHByb3BlcnR5IG9mIGBvYmplY3RgIHRocnVcbiAqIGBpdGVyYXRlZWAuIFRoZSBpdGVyYXRlZSBpcyBpbnZva2VkIHdpdGggdGhyZWUgYXJndW1lbnRzOlxuICogKHZhbHVlLCBrZXksIG9iamVjdCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAyLjQuMFxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBvYmplY3QuXG4gKiBAc2VlIF8ubWFwS2V5c1xuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgdXNlcnMgPSB7XG4gKiAgICdmcmVkJzogICAgeyAndXNlcic6ICdmcmVkJywgICAgJ2FnZSc6IDQwIH0sXG4gKiAgICdwZWJibGVzJzogeyAndXNlcic6ICdwZWJibGVzJywgJ2FnZSc6IDEgfVxuICogfTtcbiAqXG4gKiBfLm1hcFZhbHVlcyh1c2VycywgZnVuY3Rpb24obykgeyByZXR1cm4gby5hZ2U7IH0pO1xuICogLy8gPT4geyAnZnJlZCc6IDQwLCAncGViYmxlcyc6IDEgfSAoaXRlcmF0aW9uIG9yZGVyIGlzIG5vdCBndWFyYW50ZWVkKVxuICpcbiAqIC8vIFRoZSBgXy5wcm9wZXJ0eWAgaXRlcmF0ZWUgc2hvcnRoYW5kLlxuICogXy5tYXBWYWx1ZXModXNlcnMsICdhZ2UnKTtcbiAqIC8vID0+IHsgJ2ZyZWQnOiA0MCwgJ3BlYmJsZXMnOiAxIH0gKGl0ZXJhdGlvbiBvcmRlciBpcyBub3QgZ3VhcmFudGVlZClcbiAqL1xuZnVuY3Rpb24gbWFwVmFsdWVzKG9iamVjdCwgaXRlcmF0ZWUpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBpdGVyYXRlZSA9IGJhc2VJdGVyYXRlZShpdGVyYXRlZSwgMyk7XG5cbiAgYmFzZUZvck93bihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgIGJhc2VBc3NpZ25WYWx1ZShyZXN1bHQsIGtleSwgaXRlcmF0ZWUodmFsdWUsIGtleSwgb2JqZWN0KSk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1hcFZhbHVlcztcbiIsIi8qKlxuICogQmFzZWQgb24gS2VuZG8gVUkgQ29yZSBleHByZXNzaW9uIGNvZGUgPGh0dHBzOi8vZ2l0aHViLmNvbS90ZWxlcmlrL2tlbmRvLXVpLWNvcmUjbGljZW5zZS1pbmZvcm1hdGlvbj5cbiAqL1xuJ3VzZSBzdHJpY3QnXG5cbmZ1bmN0aW9uIENhY2hlKG1heFNpemUpIHtcbiAgdGhpcy5fbWF4U2l6ZSA9IG1heFNpemVcbiAgdGhpcy5jbGVhcigpXG59XG5DYWNoZS5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX3NpemUgPSAwXG4gIHRoaXMuX3ZhbHVlcyA9IE9iamVjdC5jcmVhdGUobnVsbClcbn1cbkNhY2hlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLl92YWx1ZXNba2V5XVxufVxuQ2FjaGUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gIHRoaXMuX3NpemUgPj0gdGhpcy5fbWF4U2l6ZSAmJiB0aGlzLmNsZWFyKClcbiAgaWYgKCEoa2V5IGluIHRoaXMuX3ZhbHVlcykpIHRoaXMuX3NpemUrK1xuXG4gIHJldHVybiAodGhpcy5fdmFsdWVzW2tleV0gPSB2YWx1ZSlcbn1cblxudmFyIFNQTElUX1JFR0VYID0gL1teLl5cXF1eW10rfCg/PVxcW1xcXXxcXC5cXC4pL2csXG4gIERJR0lUX1JFR0VYID0gL15cXGQrJC8sXG4gIExFQURfRElHSVRfUkVHRVggPSAvXlxcZC8sXG4gIFNQRUNfQ0hBUl9SRUdFWCA9IC9bfmAhIyQlXFxeJiorPVxcLVxcW1xcXVxcXFwnOywve318XFxcXFwiOjw+XFw/XS9nLFxuICBDTEVBTl9RVU9URVNfUkVHRVggPSAvXlxccyooWydcIl0/KSguKj8pKFxcMSlcXHMqJC8sXG4gIE1BWF9DQUNIRV9TSVpFID0gNTEyXG5cbnZhciBwYXRoQ2FjaGUgPSBuZXcgQ2FjaGUoTUFYX0NBQ0hFX1NJWkUpLFxuICBzZXRDYWNoZSA9IG5ldyBDYWNoZShNQVhfQ0FDSEVfU0laRSksXG4gIGdldENhY2hlID0gbmV3IENhY2hlKE1BWF9DQUNIRV9TSVpFKVxuXG52YXIgY29uZmlnXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBDYWNoZTogQ2FjaGUsXG5cbiAgc3BsaXQ6IHNwbGl0LFxuXG4gIG5vcm1hbGl6ZVBhdGg6IG5vcm1hbGl6ZVBhdGgsXG5cbiAgc2V0dGVyOiBmdW5jdGlvbiAocGF0aCkge1xuICAgIHZhciBwYXJ0cyA9IG5vcm1hbGl6ZVBhdGgocGF0aClcblxuICAgIHJldHVybiAoXG4gICAgICBzZXRDYWNoZS5nZXQocGF0aCkgfHxcbiAgICAgIHNldENhY2hlLnNldChwYXRoLCBmdW5jdGlvbiBzZXR0ZXIob2JqLCB2YWx1ZSkge1xuICAgICAgICB2YXIgaW5kZXggPSAwXG4gICAgICAgIHZhciBsZW4gPSBwYXJ0cy5sZW5ndGhcbiAgICAgICAgdmFyIGRhdGEgPSBvYmpcblxuICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW4gLSAxKSB7XG4gICAgICAgICAgdmFyIHBhcnQgPSBwYXJ0c1tpbmRleF1cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICBwYXJ0ID09PSAnX19wcm90b19fJyB8fFxuICAgICAgICAgICAgcGFydCA9PT0gJ2NvbnN0cnVjdG9yJyB8fFxuICAgICAgICAgICAgcGFydCA9PT0gJ3Byb3RvdHlwZSdcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkYXRhID0gZGF0YVtwYXJ0c1tpbmRleCsrXV1cbiAgICAgICAgfVxuICAgICAgICBkYXRhW3BhcnRzW2luZGV4XV0gPSB2YWx1ZVxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgZ2V0dGVyOiBmdW5jdGlvbiAocGF0aCwgc2FmZSkge1xuICAgIHZhciBwYXJ0cyA9IG5vcm1hbGl6ZVBhdGgocGF0aClcbiAgICByZXR1cm4gKFxuICAgICAgZ2V0Q2FjaGUuZ2V0KHBhdGgpIHx8XG4gICAgICBnZXRDYWNoZS5zZXQocGF0aCwgZnVuY3Rpb24gZ2V0dGVyKGRhdGEpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICBsZW4gPSBwYXJ0cy5sZW5ndGhcbiAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgaWYgKGRhdGEgIT0gbnVsbCB8fCAhc2FmZSkgZGF0YSA9IGRhdGFbcGFydHNbaW5kZXgrK11dXG4gICAgICAgICAgZWxzZSByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgfSlcbiAgICApXG4gIH0sXG5cbiAgam9pbjogZnVuY3Rpb24gKHNlZ21lbnRzKSB7XG4gICAgcmV0dXJuIHNlZ21lbnRzLnJlZHVjZShmdW5jdGlvbiAocGF0aCwgcGFydCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgcGF0aCArXG4gICAgICAgIChpc1F1b3RlZChwYXJ0KSB8fCBESUdJVF9SRUdFWC50ZXN0KHBhcnQpXG4gICAgICAgICAgPyAnWycgKyBwYXJ0ICsgJ10nXG4gICAgICAgICAgOiAocGF0aCA/ICcuJyA6ICcnKSArIHBhcnQpXG4gICAgICApXG4gICAgfSwgJycpXG4gIH0sXG5cbiAgZm9yRWFjaDogZnVuY3Rpb24gKHBhdGgsIGNiLCB0aGlzQXJnKSB7XG4gICAgZm9yRWFjaChBcnJheS5pc0FycmF5KHBhdGgpID8gcGF0aCA6IHNwbGl0KHBhdGgpLCBjYiwgdGhpc0FyZylcbiAgfSxcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUGF0aChwYXRoKSB7XG4gIHJldHVybiAoXG4gICAgcGF0aENhY2hlLmdldChwYXRoKSB8fFxuICAgIHBhdGhDYWNoZS5zZXQoXG4gICAgICBwYXRoLFxuICAgICAgc3BsaXQocGF0aCkubWFwKGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgICAgIHJldHVybiBwYXJ0LnJlcGxhY2UoQ0xFQU5fUVVPVEVTX1JFR0VYLCAnJDInKVxuICAgICAgfSlcbiAgICApXG4gIClcbn1cblxuZnVuY3Rpb24gc3BsaXQocGF0aCkge1xuICByZXR1cm4gcGF0aC5tYXRjaChTUExJVF9SRUdFWClcbn1cblxuZnVuY3Rpb24gZm9yRWFjaChwYXJ0cywgaXRlciwgdGhpc0FyZykge1xuICB2YXIgbGVuID0gcGFydHMubGVuZ3RoLFxuICAgIHBhcnQsXG4gICAgaWR4LFxuICAgIGlzQXJyYXksXG4gICAgaXNCcmFja2V0XG5cbiAgZm9yIChpZHggPSAwOyBpZHggPCBsZW47IGlkeCsrKSB7XG4gICAgcGFydCA9IHBhcnRzW2lkeF1cblxuICAgIGlmIChwYXJ0KSB7XG4gICAgICBpZiAoc2hvdWxkQmVRdW90ZWQocGFydCkpIHtcbiAgICAgICAgcGFydCA9ICdcIicgKyBwYXJ0ICsgJ1wiJ1xuICAgICAgfVxuXG4gICAgICBpc0JyYWNrZXQgPSBpc1F1b3RlZChwYXJ0KVxuICAgICAgaXNBcnJheSA9ICFpc0JyYWNrZXQgJiYgL15cXGQrJC8udGVzdChwYXJ0KVxuXG4gICAgICBpdGVyLmNhbGwodGhpc0FyZywgcGFydCwgaXNCcmFja2V0LCBpc0FycmF5LCBpZHgsIHBhcnRzKVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc1F1b3RlZChzdHIpIHtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyAmJiBzdHIgJiYgW1wiJ1wiLCAnXCInXS5pbmRleE9mKHN0ci5jaGFyQXQoMCkpICE9PSAtMVxuICApXG59XG5cbmZ1bmN0aW9uIGhhc0xlYWRpbmdOdW1iZXIocGFydCkge1xuICByZXR1cm4gcGFydC5tYXRjaChMRUFEX0RJR0lUX1JFR0VYKSAmJiAhcGFydC5tYXRjaChESUdJVF9SRUdFWClcbn1cblxuZnVuY3Rpb24gaGFzU3BlY2lhbENoYXJzKHBhcnQpIHtcbiAgcmV0dXJuIFNQRUNfQ0hBUl9SRUdFWC50ZXN0KHBhcnQpXG59XG5cbmZ1bmN0aW9uIHNob3VsZEJlUXVvdGVkKHBhcnQpIHtcbiAgcmV0dXJuICFpc1F1b3RlZChwYXJ0KSAmJiAoaGFzTGVhZGluZ051bWJlcihwYXJ0KSB8fCBoYXNTcGVjaWFsQ2hhcnMocGFydCkpXG59XG4iLCJpbXBvcnQgeyBnZXR0ZXIgfSBmcm9tICdwcm9wZXJ0eS1leHByJztcbmNvbnN0IHByZWZpeGVzID0ge1xuICBjb250ZXh0OiAnJCcsXG4gIHZhbHVlOiAnLidcbn07XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKGtleSwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFJlZmVyZW5jZShrZXksIG9wdGlvbnMpO1xufVxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVmZXJlbmNlIHtcbiAgY29uc3RydWN0b3Ioa2V5LCBvcHRpb25zID0ge30pIHtcbiAgICBpZiAodHlwZW9mIGtleSAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JlZiBtdXN0IGJlIGEgc3RyaW5nLCBnb3Q6ICcgKyBrZXkpO1xuICAgIHRoaXMua2V5ID0ga2V5LnRyaW0oKTtcbiAgICBpZiAoa2V5ID09PSAnJykgdGhyb3cgbmV3IFR5cGVFcnJvcigncmVmIG11c3QgYmUgYSBub24tZW1wdHkgc3RyaW5nJyk7XG4gICAgdGhpcy5pc0NvbnRleHQgPSB0aGlzLmtleVswXSA9PT0gcHJlZml4ZXMuY29udGV4dDtcbiAgICB0aGlzLmlzVmFsdWUgPSB0aGlzLmtleVswXSA9PT0gcHJlZml4ZXMudmFsdWU7XG4gICAgdGhpcy5pc1NpYmxpbmcgPSAhdGhpcy5pc0NvbnRleHQgJiYgIXRoaXMuaXNWYWx1ZTtcbiAgICBsZXQgcHJlZml4ID0gdGhpcy5pc0NvbnRleHQgPyBwcmVmaXhlcy5jb250ZXh0IDogdGhpcy5pc1ZhbHVlID8gcHJlZml4ZXMudmFsdWUgOiAnJztcbiAgICB0aGlzLnBhdGggPSB0aGlzLmtleS5zbGljZShwcmVmaXgubGVuZ3RoKTtcbiAgICB0aGlzLmdldHRlciA9IHRoaXMucGF0aCAmJiBnZXR0ZXIodGhpcy5wYXRoLCB0cnVlKTtcbiAgICB0aGlzLm1hcCA9IG9wdGlvbnMubWFwO1xuICB9XG5cbiAgZ2V0VmFsdWUodmFsdWUsIHBhcmVudCwgY29udGV4dCkge1xuICAgIGxldCByZXN1bHQgPSB0aGlzLmlzQ29udGV4dCA/IGNvbnRleHQgOiB0aGlzLmlzVmFsdWUgPyB2YWx1ZSA6IHBhcmVudDtcbiAgICBpZiAodGhpcy5nZXR0ZXIpIHJlc3VsdCA9IHRoaXMuZ2V0dGVyKHJlc3VsdCB8fCB7fSk7XG4gICAgaWYgKHRoaXMubWFwKSByZXN1bHQgPSB0aGlzLm1hcChyZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gdmFsdWVcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zLmNvbnRleHRcbiAgICogQHBhcmFtIHtPYmplY3Q9fSBvcHRpb25zLnBhcmVudFxuICAgKi9cblxuXG4gIGNhc3QodmFsdWUsIG9wdGlvbnMpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZSh2YWx1ZSwgb3B0aW9ucyA9PSBudWxsID8gdm9pZCAwIDogb3B0aW9ucy5wYXJlbnQsIG9wdGlvbnMgPT0gbnVsbCA/IHZvaWQgMCA6IG9wdGlvbnMuY29udGV4dCk7XG4gIH1cblxuICByZXNvbHZlKCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVzY3JpYmUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdyZWYnLFxuICAgICAga2V5OiB0aGlzLmtleVxuICAgIH07XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gYFJlZigke3RoaXMua2V5fSlgO1xuICB9XG5cbiAgc3RhdGljIGlzUmVmKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHZhbHVlLl9faXNZdXBSZWY7XG4gIH1cblxufSAvLyBAdHMtaWdub3JlXG5cblJlZmVyZW5jZS5wcm90b3R5cGUuX19pc1l1cFJlZiA9IHRydWU7IiwiZnVuY3Rpb24gX2V4dGVuZHMoKSB7IF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTsgcmV0dXJuIF9leHRlbmRzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH1cblxuZnVuY3Rpb24gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzTG9vc2Uoc291cmNlLCBleGNsdWRlZCkgeyBpZiAoc291cmNlID09IG51bGwpIHJldHVybiB7fTsgdmFyIHRhcmdldCA9IHt9OyB2YXIgc291cmNlS2V5cyA9IE9iamVjdC5rZXlzKHNvdXJjZSk7IHZhciBrZXksIGk7IGZvciAoaSA9IDA7IGkgPCBzb3VyY2VLZXlzLmxlbmd0aDsgaSsrKSB7IGtleSA9IHNvdXJjZUtleXNbaV07IGlmIChleGNsdWRlZC5pbmRleE9mKGtleSkgPj0gMCkgY29udGludWU7IHRhcmdldFtrZXldID0gc291cmNlW2tleV07IH0gcmV0dXJuIHRhcmdldDsgfVxuXG5pbXBvcnQgbWFwVmFsdWVzIGZyb20gJ2xvZGFzaC9tYXBWYWx1ZXMnO1xuaW1wb3J0IFZhbGlkYXRpb25FcnJvciBmcm9tICcuLi9WYWxpZGF0aW9uRXJyb3InO1xuaW1wb3J0IFJlZiBmcm9tICcuLi9SZWZlcmVuY2UnO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY3JlYXRlVmFsaWRhdGlvbihjb25maWcpIHtcbiAgZnVuY3Rpb24gdmFsaWRhdGUoX3JlZiwgY2IpIHtcbiAgICBsZXQge1xuICAgICAgdmFsdWUsXG4gICAgICBwYXRoID0gJycsXG4gICAgICBsYWJlbCxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBvcmlnaW5hbFZhbHVlLFxuICAgICAgc3luY1xuICAgIH0gPSBfcmVmLFxuICAgICAgICByZXN0ID0gX29iamVjdFdpdGhvdXRQcm9wZXJ0aWVzTG9vc2UoX3JlZiwgW1widmFsdWVcIiwgXCJwYXRoXCIsIFwibGFiZWxcIiwgXCJvcHRpb25zXCIsIFwib3JpZ2luYWxWYWx1ZVwiLCBcInN5bmNcIl0pO1xuXG4gICAgY29uc3Qge1xuICAgICAgbmFtZSxcbiAgICAgIHRlc3QsXG4gICAgICBwYXJhbXMsXG4gICAgICBtZXNzYWdlXG4gICAgfSA9IGNvbmZpZztcbiAgICBsZXQge1xuICAgICAgcGFyZW50LFxuICAgICAgY29udGV4dFxuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgZnVuY3Rpb24gcmVzb2x2ZShpdGVtKSB7XG4gICAgICByZXR1cm4gUmVmLmlzUmVmKGl0ZW0pID8gaXRlbS5nZXRWYWx1ZSh2YWx1ZSwgcGFyZW50LCBjb250ZXh0KSA6IGl0ZW07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRXJyb3Iob3ZlcnJpZGVzID0ge30pIHtcbiAgICAgIGNvbnN0IG5leHRQYXJhbXMgPSBtYXBWYWx1ZXMoX2V4dGVuZHMoe1xuICAgICAgICB2YWx1ZSxcbiAgICAgICAgb3JpZ2luYWxWYWx1ZSxcbiAgICAgICAgbGFiZWwsXG4gICAgICAgIHBhdGg6IG92ZXJyaWRlcy5wYXRoIHx8IHBhdGhcbiAgICAgIH0sIHBhcmFtcywgb3ZlcnJpZGVzLnBhcmFtcyksIHJlc29sdmUpO1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgVmFsaWRhdGlvbkVycm9yKFZhbGlkYXRpb25FcnJvci5mb3JtYXRFcnJvcihvdmVycmlkZXMubWVzc2FnZSB8fCBtZXNzYWdlLCBuZXh0UGFyYW1zKSwgdmFsdWUsIG5leHRQYXJhbXMucGF0aCwgb3ZlcnJpZGVzLnR5cGUgfHwgbmFtZSk7XG4gICAgICBlcnJvci5wYXJhbXMgPSBuZXh0UGFyYW1zO1xuICAgICAgcmV0dXJuIGVycm9yO1xuICAgIH1cblxuICAgIGxldCBjdHggPSBfZXh0ZW5kcyh7XG4gICAgICBwYXRoLFxuICAgICAgcGFyZW50LFxuICAgICAgdHlwZTogbmFtZSxcbiAgICAgIGNyZWF0ZUVycm9yLFxuICAgICAgcmVzb2x2ZSxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBvcmlnaW5hbFZhbHVlXG4gICAgfSwgcmVzdCk7XG5cbiAgICBpZiAoIXN5bmMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFByb21pc2UucmVzb2x2ZSh0ZXN0LmNhbGwoY3R4LCB2YWx1ZSwgY3R4KSkudGhlbih2YWxpZE9yRXJyb3IgPT4ge1xuICAgICAgICAgIGlmIChWYWxpZGF0aW9uRXJyb3IuaXNFcnJvcih2YWxpZE9yRXJyb3IpKSBjYih2YWxpZE9yRXJyb3IpO2Vsc2UgaWYgKCF2YWxpZE9yRXJyb3IpIGNiKGNyZWF0ZUVycm9yKCkpO2Vsc2UgY2IobnVsbCwgdmFsaWRPckVycm9yKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY2IoZXJyKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCByZXN1bHQ7XG5cbiAgICB0cnkge1xuICAgICAgdmFyIF9yZWYyO1xuXG4gICAgICByZXN1bHQgPSB0ZXN0LmNhbGwoY3R4LCB2YWx1ZSwgY3R4KTtcblxuICAgICAgaWYgKHR5cGVvZiAoKF9yZWYyID0gcmVzdWx0KSA9PSBudWxsID8gdm9pZCAwIDogX3JlZjIudGhlbikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBWYWxpZGF0aW9uIHRlc3Qgb2YgdHlwZTogXCIke2N0eC50eXBlfVwiIHJldHVybmVkIGEgUHJvbWlzZSBkdXJpbmcgYSBzeW5jaHJvbm91cyB2YWxpZGF0ZS4gYCArIGBUaGlzIHRlc3Qgd2lsbCBmaW5pc2ggYWZ0ZXIgdGhlIHZhbGlkYXRlIGNhbGwgaGFzIHJldHVybmVkYCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjYihlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChWYWxpZGF0aW9uRXJyb3IuaXNFcnJvcihyZXN1bHQpKSBjYihyZXN1bHQpO2Vsc2UgaWYgKCFyZXN1bHQpIGNiKGNyZWF0ZUVycm9yKCkpO2Vsc2UgY2IobnVsbCwgcmVzdWx0KTtcbiAgfVxuXG4gIHZhbGlkYXRlLk9QVElPTlMgPSBjb25maWc7XG4gIHJldHVybiB2YWxpZGF0ZTtcbn0iLCJpbXBvcnQgeyBmb3JFYWNoIH0gZnJvbSAncHJvcGVydHktZXhwcic7XG5cbmxldCB0cmltID0gcGFydCA9PiBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpLnN1YnN0cigxKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluKHNjaGVtYSwgcGF0aCwgdmFsdWUsIGNvbnRleHQgPSB2YWx1ZSkge1xuICBsZXQgcGFyZW50LCBsYXN0UGFydCwgbGFzdFBhcnREZWJ1ZzsgLy8gcm9vdCBwYXRoOiAnJ1xuXG4gIGlmICghcGF0aCkgcmV0dXJuIHtcbiAgICBwYXJlbnQsXG4gICAgcGFyZW50UGF0aDogcGF0aCxcbiAgICBzY2hlbWFcbiAgfTtcbiAgZm9yRWFjaChwYXRoLCAoX3BhcnQsIGlzQnJhY2tldCwgaXNBcnJheSkgPT4ge1xuICAgIGxldCBwYXJ0ID0gaXNCcmFja2V0ID8gdHJpbShfcGFydCkgOiBfcGFydDtcbiAgICBzY2hlbWEgPSBzY2hlbWEucmVzb2x2ZSh7XG4gICAgICBjb250ZXh0LFxuICAgICAgcGFyZW50LFxuICAgICAgdmFsdWVcbiAgICB9KTtcblxuICAgIGlmIChzY2hlbWEuaW5uZXJUeXBlKSB7XG4gICAgICBsZXQgaWR4ID0gaXNBcnJheSA/IHBhcnNlSW50KHBhcnQsIDEwKSA6IDA7XG5cbiAgICAgIGlmICh2YWx1ZSAmJiBpZHggPj0gdmFsdWUubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgWXVwLnJlYWNoIGNhbm5vdCByZXNvbHZlIGFuIGFycmF5IGl0ZW0gYXQgaW5kZXg6ICR7X3BhcnR9LCBpbiB0aGUgcGF0aDogJHtwYXRofS4gYCArIGBiZWNhdXNlIHRoZXJlIGlzIG5vIHZhbHVlIGF0IHRoYXQgaW5kZXguIGApO1xuICAgICAgfVxuXG4gICAgICBwYXJlbnQgPSB2YWx1ZTtcbiAgICAgIHZhbHVlID0gdmFsdWUgJiYgdmFsdWVbaWR4XTtcbiAgICAgIHNjaGVtYSA9IHNjaGVtYS5pbm5lclR5cGU7XG4gICAgfSAvLyBzb21ldGltZXMgdGhlIGFycmF5IGluZGV4IHBhcnQgb2YgYSBwYXRoIGRvZXNuJ3QgZXhpc3Q6IFwibmVzdGVkLmFyci5jaGlsZFwiXG4gICAgLy8gaW4gdGhlc2UgY2FzZXMgdGhlIGN1cnJlbnQgcGFydCBpcyB0aGUgbmV4dCBzY2hlbWEgYW5kIHNob3VsZCBiZSBwcm9jZXNzZWRcbiAgICAvLyBpbiB0aGlzIGl0ZXJhdGlvbi4gRm9yIGNhc2VzIHdoZXJlIHRoZSBpbmRleCBzaWduYXR1cmUgaXMgaW5jbHVkZWQgdGhpc1xuICAgIC8vIGNoZWNrIHdpbGwgZmFpbCBhbmQgd2UnbGwgaGFuZGxlIHRoZSBgY2hpbGRgIHBhcnQgb24gdGhlIG5leHQgaXRlcmF0aW9uIGxpa2Ugbm9ybWFsXG5cblxuICAgIGlmICghaXNBcnJheSkge1xuICAgICAgaWYgKCFzY2hlbWEuZmllbGRzIHx8ICFzY2hlbWEuZmllbGRzW3BhcnRdKSB0aHJvdyBuZXcgRXJyb3IoYFRoZSBzY2hlbWEgZG9lcyBub3QgY29udGFpbiB0aGUgcGF0aDogJHtwYXRofS4gYCArIGAoZmFpbGVkIGF0OiAke2xhc3RQYXJ0RGVidWd9IHdoaWNoIGlzIGEgdHlwZTogXCIke3NjaGVtYS5fdHlwZX1cIilgKTtcbiAgICAgIHBhcmVudCA9IHZhbHVlO1xuICAgICAgdmFsdWUgPSB2YWx1ZSAmJiB2YWx1ZVtwYXJ0XTtcbiAgICAgIHNjaGVtYSA9IHNjaGVtYS5maWVsZHNbcGFydF07XG4gICAgfVxuXG4gICAgbGFzdFBhcnQgPSBwYXJ0O1xuICAgIGxhc3RQYXJ0RGVidWcgPSBpc0JyYWNrZXQgPyAnWycgKyBfcGFydCArICddJyA6ICcuJyArIF9wYXJ0O1xuICB9KTtcbiAgcmV0dXJuIHtcbiAgICBzY2hlbWEsXG4gICAgcGFyZW50LFxuICAgIHBhcmVudFBhdGg6IGxhc3RQYXJ0XG4gIH07XG59XG5cbmNvbnN0IHJlYWNoID0gKG9iaiwgcGF0aCwgdmFsdWUsIGNvbnRleHQpID0+IGdldEluKG9iaiwgcGF0aCwgdmFsdWUsIGNvbnRleHQpLnNjaGVtYTtcblxuZXhwb3J0IGRlZmF1bHQgcmVhY2g7IiwiaW1wb3J0IFJlZmVyZW5jZSBmcm9tICcuLi9SZWZlcmVuY2UnO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVmZXJlbmNlU2V0IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5saXN0ID0gbmV3IFNldCgpO1xuICAgIHRoaXMucmVmcyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGdldCBzaXplKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3Quc2l6ZSArIHRoaXMucmVmcy5zaXplO1xuICB9XG5cbiAgZGVzY3JpYmUoKSB7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSBbXTtcblxuICAgIGZvciAoY29uc3QgaXRlbSBvZiB0aGlzLmxpc3QpIGRlc2NyaXB0aW9uLnB1c2goaXRlbSk7XG5cbiAgICBmb3IgKGNvbnN0IFssIHJlZl0gb2YgdGhpcy5yZWZzKSBkZXNjcmlwdGlvbi5wdXNoKHJlZi5kZXNjcmliZSgpKTtcblxuICAgIHJldHVybiBkZXNjcmlwdGlvbjtcbiAgfVxuXG4gIHRvQXJyYXkoKSB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5saXN0KS5jb25jYXQoQXJyYXkuZnJvbSh0aGlzLnJlZnMudmFsdWVzKCkpKTtcbiAgfVxuXG4gIGFkZCh2YWx1ZSkge1xuICAgIFJlZmVyZW5jZS5pc1JlZih2YWx1ZSkgPyB0aGlzLnJlZnMuc2V0KHZhbHVlLmtleSwgdmFsdWUpIDogdGhpcy5saXN0LmFkZCh2YWx1ZSk7XG4gIH1cblxuICBkZWxldGUodmFsdWUpIHtcbiAgICBSZWZlcmVuY2UuaXNSZWYodmFsdWUpID8gdGhpcy5yZWZzLmRlbGV0ZSh2YWx1ZS5rZXkpIDogdGhpcy5saXN0LmRlbGV0ZSh2YWx1ZSk7XG4gIH1cblxuICBoYXModmFsdWUsIHJlc29sdmUpIHtcbiAgICBpZiAodGhpcy5saXN0Lmhhcyh2YWx1ZSkpIHJldHVybiB0cnVlO1xuICAgIGxldCBpdGVtLFxuICAgICAgICB2YWx1ZXMgPSB0aGlzLnJlZnMudmFsdWVzKCk7XG5cbiAgICB3aGlsZSAoaXRlbSA9IHZhbHVlcy5uZXh0KCksICFpdGVtLmRvbmUpIGlmIChyZXNvbHZlKGl0ZW0udmFsdWUpID09PSB2YWx1ZSkgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjbG9uZSgpIHtcbiAgICBjb25zdCBuZXh0ID0gbmV3IFJlZmVyZW5jZVNldCgpO1xuICAgIG5leHQubGlzdCA9IG5ldyBTZXQodGhpcy5saXN0KTtcbiAgICBuZXh0LnJlZnMgPSBuZXcgTWFwKHRoaXMucmVmcyk7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH1cblxuICBtZXJnZShuZXdJdGVtcywgcmVtb3ZlSXRlbXMpIHtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy5jbG9uZSgpO1xuICAgIG5ld0l0ZW1zLmxpc3QuZm9yRWFjaCh2YWx1ZSA9PiBuZXh0LmFkZCh2YWx1ZSkpO1xuICAgIG5ld0l0ZW1zLnJlZnMuZm9yRWFjaCh2YWx1ZSA9PiBuZXh0LmFkZCh2YWx1ZSkpO1xuICAgIHJlbW92ZUl0ZW1zLmxpc3QuZm9yRWFjaCh2YWx1ZSA9PiBuZXh0LmRlbGV0ZSh2YWx1ZSkpO1xuICAgIHJlbW92ZUl0ZW1zLnJlZnMuZm9yRWFjaCh2YWx1ZSA9PiBuZXh0LmRlbGV0ZSh2YWx1ZSkpO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbn0iLCJmdW5jdGlvbiBfZXh0ZW5kcygpIHsgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9OyByZXR1cm4gX2V4dGVuZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxuXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgY2xvbmVEZWVwIGZyb20gJ25hbm9jbG9uZSc7XG5pbXBvcnQgeyBtaXhlZCBhcyBsb2NhbGUgfSBmcm9tICcuL2xvY2FsZSc7XG5pbXBvcnQgQ29uZGl0aW9uIGZyb20gJy4vQ29uZGl0aW9uJztcbmltcG9ydCBydW5UZXN0cyBmcm9tICcuL3V0aWwvcnVuVGVzdHMnO1xuaW1wb3J0IGNyZWF0ZVZhbGlkYXRpb24gZnJvbSAnLi91dGlsL2NyZWF0ZVZhbGlkYXRpb24nO1xuaW1wb3J0IHByaW50VmFsdWUgZnJvbSAnLi91dGlsL3ByaW50VmFsdWUnO1xuaW1wb3J0IFJlZiBmcm9tICcuL1JlZmVyZW5jZSc7XG5pbXBvcnQgeyBnZXRJbiB9IGZyb20gJy4vdXRpbC9yZWFjaCc7XG5pbXBvcnQgdG9BcnJheSBmcm9tICcuL3V0aWwvdG9BcnJheSc7XG5pbXBvcnQgVmFsaWRhdGlvbkVycm9yIGZyb20gJy4vVmFsaWRhdGlvbkVycm9yJztcbmltcG9ydCBSZWZlcmVuY2VTZXQgZnJvbSAnLi91dGlsL1JlZmVyZW5jZVNldCc7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCYXNlU2NoZW1hIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHRoaXMuZGVwcyA9IFtdO1xuICAgIHRoaXMuY29uZGl0aW9ucyA9IFtdO1xuICAgIHRoaXMuX3doaXRlbGlzdCA9IG5ldyBSZWZlcmVuY2VTZXQoKTtcbiAgICB0aGlzLl9ibGFja2xpc3QgPSBuZXcgUmVmZXJlbmNlU2V0KCk7XG4gICAgdGhpcy5leGNsdXNpdmVUZXN0cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy50ZXN0cyA9IFtdO1xuICAgIHRoaXMudHJhbnNmb3JtcyA9IFtdO1xuICAgIHRoaXMud2l0aE11dGF0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMudHlwZUVycm9yKGxvY2FsZS5ub3RUeXBlKTtcbiAgICB9KTtcbiAgICB0aGlzLnR5cGUgPSAob3B0aW9ucyA9PSBudWxsID8gdm9pZCAwIDogb3B0aW9ucy50eXBlKSB8fCAnbWl4ZWQnO1xuICAgIHRoaXMuc3BlYyA9IF9leHRlbmRzKHtcbiAgICAgIHN0cmlwOiBmYWxzZSxcbiAgICAgIHN0cmljdDogZmFsc2UsXG4gICAgICBhYm9ydEVhcmx5OiB0cnVlLFxuICAgICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgICAgbnVsbGFibGU6IGZhbHNlLFxuICAgICAgcHJlc2VuY2U6ICdvcHRpb25hbCdcbiAgICB9LCBvcHRpb25zID09IG51bGwgPyB2b2lkIDAgOiBvcHRpb25zLnNwZWMpO1xuICB9IC8vIFRPRE86IHJlbW92ZVxuXG5cbiAgZ2V0IF90eXBlKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGU7XG4gIH1cblxuICBfdHlwZUNoZWNrKF92YWx1ZSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgY2xvbmUoc3BlYykge1xuICAgIGlmICh0aGlzLl9tdXRhdGUpIHtcbiAgICAgIGlmIChzcGVjKSBPYmplY3QuYXNzaWduKHRoaXMuc3BlYywgc3BlYyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IC8vIGlmIHRoZSBuZXN0ZWQgdmFsdWUgaXMgYSBzY2hlbWEgd2UgY2FuIHNraXAgY2xvbmluZywgc2luY2VcbiAgICAvLyB0aGV5IGFyZSBhbHJlYWR5IGltbXV0YWJsZVxuXG5cbiAgICBjb25zdCBuZXh0ID0gT2JqZWN0LmNyZWF0ZShPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcykpOyAvLyBAdHMtZXhwZWN0LWVycm9yIHRoaXMgaXMgcmVhZG9ubHlcblxuICAgIG5leHQudHlwZSA9IHRoaXMudHlwZTtcbiAgICBuZXh0Ll90eXBlRXJyb3IgPSB0aGlzLl90eXBlRXJyb3I7XG4gICAgbmV4dC5fd2hpdGVsaXN0RXJyb3IgPSB0aGlzLl93aGl0ZWxpc3RFcnJvcjtcbiAgICBuZXh0Ll9ibGFja2xpc3RFcnJvciA9IHRoaXMuX2JsYWNrbGlzdEVycm9yO1xuICAgIG5leHQuX3doaXRlbGlzdCA9IHRoaXMuX3doaXRlbGlzdC5jbG9uZSgpO1xuICAgIG5leHQuX2JsYWNrbGlzdCA9IHRoaXMuX2JsYWNrbGlzdC5jbG9uZSgpO1xuICAgIG5leHQuZXhjbHVzaXZlVGVzdHMgPSBfZXh0ZW5kcyh7fSwgdGhpcy5leGNsdXNpdmVUZXN0cyk7IC8vIEB0cy1leHBlY3QtZXJyb3IgdGhpcyBpcyByZWFkb25seVxuXG4gICAgbmV4dC5kZXBzID0gWy4uLnRoaXMuZGVwc107XG4gICAgbmV4dC5jb25kaXRpb25zID0gWy4uLnRoaXMuY29uZGl0aW9uc107XG4gICAgbmV4dC50ZXN0cyA9IFsuLi50aGlzLnRlc3RzXTtcbiAgICBuZXh0LnRyYW5zZm9ybXMgPSBbLi4udGhpcy50cmFuc2Zvcm1zXTtcbiAgICBuZXh0LnNwZWMgPSBjbG9uZURlZXAoX2V4dGVuZHMoe30sIHRoaXMuc3BlYywgc3BlYykpO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgbGFiZWwobGFiZWwpIHtcbiAgICB2YXIgbmV4dCA9IHRoaXMuY2xvbmUoKTtcbiAgICBuZXh0LnNwZWMubGFiZWwgPSBsYWJlbDtcbiAgICByZXR1cm4gbmV4dDtcbiAgfVxuXG4gIG1ldGEoLi4uYXJncykge1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRoaXMuc3BlYy5tZXRhO1xuICAgIGxldCBuZXh0ID0gdGhpcy5jbG9uZSgpO1xuICAgIG5leHQuc3BlYy5tZXRhID0gT2JqZWN0LmFzc2lnbihuZXh0LnNwZWMubWV0YSB8fCB7fSwgYXJnc1swXSk7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH0gLy8gd2l0aENvbnRleHQ8VENvbnRleHQgZXh0ZW5kcyBBbnlPYmplY3Q+KCk6IEJhc2VTY2hlbWE8XG4gIC8vICAgVENhc3QsXG4gIC8vICAgVENvbnRleHQsXG4gIC8vICAgVE91dHB1dFxuICAvLyA+IHtcbiAgLy8gICByZXR1cm4gdGhpcyBhcyBhbnk7XG4gIC8vIH1cblxuXG4gIHdpdGhNdXRhdGlvbihmbikge1xuICAgIGxldCBiZWZvcmUgPSB0aGlzLl9tdXRhdGU7XG4gICAgdGhpcy5fbXV0YXRlID0gdHJ1ZTtcbiAgICBsZXQgcmVzdWx0ID0gZm4odGhpcyk7XG4gICAgdGhpcy5fbXV0YXRlID0gYmVmb3JlO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjb25jYXQoc2NoZW1hKSB7XG4gICAgaWYgKCFzY2hlbWEgfHwgc2NoZW1hID09PSB0aGlzKSByZXR1cm4gdGhpcztcbiAgICBpZiAoc2NoZW1hLnR5cGUgIT09IHRoaXMudHlwZSAmJiB0aGlzLnR5cGUgIT09ICdtaXhlZCcpIHRocm93IG5ldyBUeXBlRXJyb3IoYFlvdSBjYW5ub3QgXFxgY29uY2F0KClcXGAgc2NoZW1hJ3Mgb2YgZGlmZmVyZW50IHR5cGVzOiAke3RoaXMudHlwZX0gYW5kICR7c2NoZW1hLnR5cGV9YCk7XG4gICAgbGV0IGJhc2UgPSB0aGlzO1xuICAgIGxldCBjb21iaW5lZCA9IHNjaGVtYS5jbG9uZSgpO1xuXG4gICAgY29uc3QgbWVyZ2VkU3BlYyA9IF9leHRlbmRzKHt9LCBiYXNlLnNwZWMsIGNvbWJpbmVkLnNwZWMpOyAvLyBpZiAoY29tYmluZWQuc3BlYy5udWxsYWJsZSA9PT0gVU5TRVQpXG4gICAgLy8gICBtZXJnZWRTcGVjLm51bGxhYmxlID0gYmFzZS5zcGVjLm51bGxhYmxlO1xuICAgIC8vIGlmIChjb21iaW5lZC5zcGVjLnByZXNlbmNlID09PSBVTlNFVClcbiAgICAvLyAgIG1lcmdlZFNwZWMucHJlc2VuY2UgPSBiYXNlLnNwZWMucHJlc2VuY2U7XG5cblxuICAgIGNvbWJpbmVkLnNwZWMgPSBtZXJnZWRTcGVjO1xuICAgIGNvbWJpbmVkLl90eXBlRXJyb3IgfHwgKGNvbWJpbmVkLl90eXBlRXJyb3IgPSBiYXNlLl90eXBlRXJyb3IpO1xuICAgIGNvbWJpbmVkLl93aGl0ZWxpc3RFcnJvciB8fCAoY29tYmluZWQuX3doaXRlbGlzdEVycm9yID0gYmFzZS5fd2hpdGVsaXN0RXJyb3IpO1xuICAgIGNvbWJpbmVkLl9ibGFja2xpc3RFcnJvciB8fCAoY29tYmluZWQuX2JsYWNrbGlzdEVycm9yID0gYmFzZS5fYmxhY2tsaXN0RXJyb3IpOyAvLyBtYW51YWxseSBtZXJnZSB0aGUgYmxhY2tsaXN0L3doaXRlbGlzdCAodGhlIG90aGVyIGBzY2hlbWFgIHRha2VzXG4gICAgLy8gcHJlY2VkZW5jZSBpbiBjYXNlIG9mIGNvbmZsaWN0cylcblxuICAgIGNvbWJpbmVkLl93aGl0ZWxpc3QgPSBiYXNlLl93aGl0ZWxpc3QubWVyZ2Uoc2NoZW1hLl93aGl0ZWxpc3QsIHNjaGVtYS5fYmxhY2tsaXN0KTtcbiAgICBjb21iaW5lZC5fYmxhY2tsaXN0ID0gYmFzZS5fYmxhY2tsaXN0Lm1lcmdlKHNjaGVtYS5fYmxhY2tsaXN0LCBzY2hlbWEuX3doaXRlbGlzdCk7IC8vIHN0YXJ0IHdpdGggdGhlIGN1cnJlbnQgdGVzdHNcblxuICAgIGNvbWJpbmVkLnRlc3RzID0gYmFzZS50ZXN0cztcbiAgICBjb21iaW5lZC5leGNsdXNpdmVUZXN0cyA9IGJhc2UuZXhjbHVzaXZlVGVzdHM7IC8vIG1hbnVhbGx5IGFkZCB0aGUgbmV3IHRlc3RzIHRvIGVuc3VyZVxuICAgIC8vIHRoZSBkZWR1cGluZyBsb2dpYyBpcyBjb25zaXN0ZW50XG5cbiAgICBjb21iaW5lZC53aXRoTXV0YXRpb24obmV4dCA9PiB7XG4gICAgICBzY2hlbWEudGVzdHMuZm9yRWFjaChmbiA9PiB7XG4gICAgICAgIG5leHQudGVzdChmbi5PUFRJT05TKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiBjb21iaW5lZDtcbiAgfVxuXG4gIGlzVHlwZSh2KSB7XG4gICAgaWYgKHRoaXMuc3BlYy5udWxsYWJsZSAmJiB2ID09PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5fdHlwZUNoZWNrKHYpO1xuICB9XG5cbiAgcmVzb2x2ZShvcHRpb25zKSB7XG4gICAgbGV0IHNjaGVtYSA9IHRoaXM7XG5cbiAgICBpZiAoc2NoZW1hLmNvbmRpdGlvbnMubGVuZ3RoKSB7XG4gICAgICBsZXQgY29uZGl0aW9ucyA9IHNjaGVtYS5jb25kaXRpb25zO1xuICAgICAgc2NoZW1hID0gc2NoZW1hLmNsb25lKCk7XG4gICAgICBzY2hlbWEuY29uZGl0aW9ucyA9IFtdO1xuICAgICAgc2NoZW1hID0gY29uZGl0aW9ucy5yZWR1Y2UoKHNjaGVtYSwgY29uZGl0aW9uKSA9PiBjb25kaXRpb24ucmVzb2x2ZShzY2hlbWEsIG9wdGlvbnMpLCBzY2hlbWEpO1xuICAgICAgc2NoZW1hID0gc2NoZW1hLnJlc29sdmUob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYTtcbiAgfVxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHsqfSB2YWx1ZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAcGFyYW0geyo9fSBvcHRpb25zLnBhcmVudFxuICAgKiBAcGFyYW0geyo9fSBvcHRpb25zLmNvbnRleHRcbiAgICovXG5cblxuICBjYXN0KHZhbHVlLCBvcHRpb25zID0ge30pIHtcbiAgICBsZXQgcmVzb2x2ZWRTY2hlbWEgPSB0aGlzLnJlc29sdmUoX2V4dGVuZHMoe1xuICAgICAgdmFsdWVcbiAgICB9LCBvcHRpb25zKSk7XG5cbiAgICBsZXQgcmVzdWx0ID0gcmVzb2x2ZWRTY2hlbWEuX2Nhc3QodmFsdWUsIG9wdGlvbnMpO1xuXG4gICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQgJiYgb3B0aW9ucy5hc3NlcnQgIT09IGZhbHNlICYmIHJlc29sdmVkU2NoZW1hLmlzVHlwZShyZXN1bHQpICE9PSB0cnVlKSB7XG4gICAgICBsZXQgZm9ybWF0dGVkVmFsdWUgPSBwcmludFZhbHVlKHZhbHVlKTtcbiAgICAgIGxldCBmb3JtYXR0ZWRSZXN1bHQgPSBwcmludFZhbHVlKHJlc3VsdCk7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBUaGUgdmFsdWUgb2YgJHtvcHRpb25zLnBhdGggfHwgJ2ZpZWxkJ30gY291bGQgbm90IGJlIGNhc3QgdG8gYSB2YWx1ZSBgICsgYHRoYXQgc2F0aXNmaWVzIHRoZSBzY2hlbWEgdHlwZTogXCIke3Jlc29sdmVkU2NoZW1hLl90eXBlfVwiLiBcXG5cXG5gICsgYGF0dGVtcHRlZCB2YWx1ZTogJHtmb3JtYXR0ZWRWYWx1ZX0gXFxuYCArIChmb3JtYXR0ZWRSZXN1bHQgIT09IGZvcm1hdHRlZFZhbHVlID8gYHJlc3VsdCBvZiBjYXN0OiAke2Zvcm1hdHRlZFJlc3VsdH1gIDogJycpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgX2Nhc3QocmF3VmFsdWUsIF9vcHRpb25zKSB7XG4gICAgbGV0IHZhbHVlID0gcmF3VmFsdWUgPT09IHVuZGVmaW5lZCA/IHJhd1ZhbHVlIDogdGhpcy50cmFuc2Zvcm1zLnJlZHVjZSgodmFsdWUsIGZuKSA9PiBmbi5jYWxsKHRoaXMsIHZhbHVlLCByYXdWYWx1ZSwgdGhpcyksIHJhd1ZhbHVlKTtcblxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB2YWx1ZSA9IHRoaXMuZ2V0RGVmYXVsdCgpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIF92YWxpZGF0ZShfdmFsdWUsIG9wdGlvbnMgPSB7fSwgY2IpIHtcbiAgICBsZXQge1xuICAgICAgc3luYyxcbiAgICAgIHBhdGgsXG4gICAgICBmcm9tID0gW10sXG4gICAgICBvcmlnaW5hbFZhbHVlID0gX3ZhbHVlLFxuICAgICAgc3RyaWN0ID0gdGhpcy5zcGVjLnN0cmljdCxcbiAgICAgIGFib3J0RWFybHkgPSB0aGlzLnNwZWMuYWJvcnRFYXJseVxuICAgIH0gPSBvcHRpb25zO1xuICAgIGxldCB2YWx1ZSA9IF92YWx1ZTtcblxuICAgIGlmICghc3RyaWN0KSB7XG4gICAgICAvLyB0aGlzLl92YWxpZGF0aW5nID0gdHJ1ZTtcbiAgICAgIHZhbHVlID0gdGhpcy5fY2FzdCh2YWx1ZSwgX2V4dGVuZHMoe1xuICAgICAgICBhc3NlcnQ6IGZhbHNlXG4gICAgICB9LCBvcHRpb25zKSk7IC8vIHRoaXMuX3ZhbGlkYXRpbmcgPSBmYWxzZTtcbiAgICB9IC8vIHZhbHVlIGlzIGNhc3QsIHdlIGNhbiBjaGVjayBpZiBpdCBtZWV0cyB0eXBlIHJlcXVpcmVtZW50c1xuXG5cbiAgICBsZXQgYXJncyA9IHtcbiAgICAgIHZhbHVlLFxuICAgICAgcGF0aCxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBvcmlnaW5hbFZhbHVlLFxuICAgICAgc2NoZW1hOiB0aGlzLFxuICAgICAgbGFiZWw6IHRoaXMuc3BlYy5sYWJlbCxcbiAgICAgIHN5bmMsXG4gICAgICBmcm9tXG4gICAgfTtcbiAgICBsZXQgaW5pdGlhbFRlc3RzID0gW107XG4gICAgaWYgKHRoaXMuX3R5cGVFcnJvcikgaW5pdGlhbFRlc3RzLnB1c2godGhpcy5fdHlwZUVycm9yKTtcbiAgICBpZiAodGhpcy5fd2hpdGVsaXN0RXJyb3IpIGluaXRpYWxUZXN0cy5wdXNoKHRoaXMuX3doaXRlbGlzdEVycm9yKTtcbiAgICBpZiAodGhpcy5fYmxhY2tsaXN0RXJyb3IpIGluaXRpYWxUZXN0cy5wdXNoKHRoaXMuX2JsYWNrbGlzdEVycm9yKTtcbiAgICBydW5UZXN0cyh7XG4gICAgICBhcmdzLFxuICAgICAgdmFsdWUsXG4gICAgICBwYXRoLFxuICAgICAgc3luYyxcbiAgICAgIHRlc3RzOiBpbml0aWFsVGVzdHMsXG4gICAgICBlbmRFYXJseTogYWJvcnRFYXJseVxuICAgIH0sIGVyciA9PiB7XG4gICAgICBpZiAoZXJyKSByZXR1cm4gdm9pZCBjYihlcnIsIHZhbHVlKTtcbiAgICAgIHJ1blRlc3RzKHtcbiAgICAgICAgdGVzdHM6IHRoaXMudGVzdHMsXG4gICAgICAgIGFyZ3MsXG4gICAgICAgIHBhdGgsXG4gICAgICAgIHN5bmMsXG4gICAgICAgIHZhbHVlLFxuICAgICAgICBlbmRFYXJseTogYWJvcnRFYXJseVxuICAgICAgfSwgY2IpO1xuICAgIH0pO1xuICB9XG5cbiAgdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMsIG1heWJlQ2IpIHtcbiAgICBsZXQgc2NoZW1hID0gdGhpcy5yZXNvbHZlKF9leHRlbmRzKHt9LCBvcHRpb25zLCB7XG4gICAgICB2YWx1ZVxuICAgIH0pKTsgLy8gY2FsbGJhY2sgY2FzZSBpcyBmb3IgbmVzdGVkIHZhbGlkYXRpb25zXG5cbiAgICByZXR1cm4gdHlwZW9mIG1heWJlQ2IgPT09ICdmdW5jdGlvbicgPyBzY2hlbWEuX3ZhbGlkYXRlKHZhbHVlLCBvcHRpb25zLCBtYXliZUNiKSA6IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHNjaGVtYS5fdmFsaWRhdGUodmFsdWUsIG9wdGlvbnMsIChlcnIsIHZhbHVlKSA9PiB7XG4gICAgICBpZiAoZXJyKSByZWplY3QoZXJyKTtlbHNlIHJlc29sdmUodmFsdWUpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHZhbGlkYXRlU3luYyh2YWx1ZSwgb3B0aW9ucykge1xuICAgIGxldCBzY2hlbWEgPSB0aGlzLnJlc29sdmUoX2V4dGVuZHMoe30sIG9wdGlvbnMsIHtcbiAgICAgIHZhbHVlXG4gICAgfSkpO1xuICAgIGxldCByZXN1bHQ7XG5cbiAgICBzY2hlbWEuX3ZhbGlkYXRlKHZhbHVlLCBfZXh0ZW5kcyh7fSwgb3B0aW9ucywge1xuICAgICAgc3luYzogdHJ1ZVxuICAgIH0pLCAoZXJyLCB2YWx1ZSkgPT4ge1xuICAgICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgICAgcmVzdWx0ID0gdmFsdWU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgaXNWYWxpZCh2YWx1ZSwgb3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLnZhbGlkYXRlKHZhbHVlLCBvcHRpb25zKS50aGVuKCgpID0+IHRydWUsIGVyciA9PiB7XG4gICAgICBpZiAoVmFsaWRhdGlvbkVycm9yLmlzRXJyb3IoZXJyKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pO1xuICB9XG5cbiAgaXNWYWxpZFN5bmModmFsdWUsIG9wdGlvbnMpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy52YWxpZGF0ZVN5bmModmFsdWUsIG9wdGlvbnMpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoVmFsaWRhdGlvbkVycm9yLmlzRXJyb3IoZXJyKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIF9nZXREZWZhdWx0KCkge1xuICAgIGxldCBkZWZhdWx0VmFsdWUgPSB0aGlzLnNwZWMuZGVmYXVsdDtcblxuICAgIGlmIChkZWZhdWx0VmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHlwZW9mIGRlZmF1bHRWYWx1ZSA9PT0gJ2Z1bmN0aW9uJyA/IGRlZmF1bHRWYWx1ZS5jYWxsKHRoaXMpIDogY2xvbmVEZWVwKGRlZmF1bHRWYWx1ZSk7XG4gIH1cblxuICBnZXREZWZhdWx0KG9wdGlvbnMpIHtcbiAgICBsZXQgc2NoZW1hID0gdGhpcy5yZXNvbHZlKG9wdGlvbnMgfHwge30pO1xuICAgIHJldHVybiBzY2hlbWEuX2dldERlZmF1bHQoKTtcbiAgfVxuXG4gIGRlZmF1bHQoZGVmKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0aGlzLl9nZXREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgbGV0IG5leHQgPSB0aGlzLmNsb25lKHtcbiAgICAgIGRlZmF1bHQ6IGRlZlxuICAgIH0pO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgc3RyaWN0KGlzU3RyaWN0ID0gdHJ1ZSkge1xuICAgIHZhciBuZXh0ID0gdGhpcy5jbG9uZSgpO1xuICAgIG5leHQuc3BlYy5zdHJpY3QgPSBpc1N0cmljdDtcbiAgICByZXR1cm4gbmV4dDtcbiAgfVxuXG4gIF9pc1ByZXNlbnQodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgIT0gbnVsbDtcbiAgfVxuXG4gIGRlZmluZWQobWVzc2FnZSA9IGxvY2FsZS5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMudGVzdCh7XG4gICAgICBtZXNzYWdlLFxuICAgICAgbmFtZTogJ2RlZmluZWQnLFxuICAgICAgZXhjbHVzaXZlOiB0cnVlLFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSAhPT0gdW5kZWZpbmVkO1xuICAgICAgfVxuXG4gICAgfSk7XG4gIH1cblxuICByZXF1aXJlZChtZXNzYWdlID0gbG9jYWxlLnJlcXVpcmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xvbmUoe1xuICAgICAgcHJlc2VuY2U6ICdyZXF1aXJlZCdcbiAgICB9KS53aXRoTXV0YXRpb24ocyA9PiBzLnRlc3Qoe1xuICAgICAgbWVzc2FnZSxcbiAgICAgIG5hbWU6ICdyZXF1aXJlZCcsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG5cbiAgICAgIHRlc3QodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NoZW1hLl9pc1ByZXNlbnQodmFsdWUpO1xuICAgICAgfVxuXG4gICAgfSkpO1xuICB9XG5cbiAgbm90UmVxdWlyZWQoKSB7XG4gICAgdmFyIG5leHQgPSB0aGlzLmNsb25lKHtcbiAgICAgIHByZXNlbmNlOiAnb3B0aW9uYWwnXG4gICAgfSk7XG4gICAgbmV4dC50ZXN0cyA9IG5leHQudGVzdHMuZmlsdGVyKHRlc3QgPT4gdGVzdC5PUFRJT05TLm5hbWUgIT09ICdyZXF1aXJlZCcpO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgbnVsbGFibGUoaXNOdWxsYWJsZSA9IHRydWUpIHtcbiAgICB2YXIgbmV4dCA9IHRoaXMuY2xvbmUoe1xuICAgICAgbnVsbGFibGU6IGlzTnVsbGFibGUgIT09IGZhbHNlXG4gICAgfSk7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH1cblxuICB0cmFuc2Zvcm0oZm4pIHtcbiAgICB2YXIgbmV4dCA9IHRoaXMuY2xvbmUoKTtcbiAgICBuZXh0LnRyYW5zZm9ybXMucHVzaChmbik7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH1cbiAgLyoqXG4gICAqIEFkZHMgYSB0ZXN0IGZ1bmN0aW9uIHRvIHRoZSBzY2hlbWEncyBxdWV1ZSBvZiB0ZXN0cy5cbiAgICogdGVzdHMgY2FuIGJlIGV4Y2x1c2l2ZSBvciBub24tZXhjbHVzaXZlLlxuICAgKlxuICAgKiAtIGV4Y2x1c2l2ZSB0ZXN0cywgd2lsbCByZXBsYWNlIGFueSBleGlzdGluZyB0ZXN0cyBvZiB0aGUgc2FtZSBuYW1lLlxuICAgKiAtIG5vbi1leGNsdXNpdmU6IGNhbiBiZSBzdGFja2VkXG4gICAqXG4gICAqIElmIGEgbm9uLWV4Y2x1c2l2ZSB0ZXN0IGlzIGFkZGVkIHRvIGEgc2NoZW1hIHdpdGggYW4gZXhjbHVzaXZlIHRlc3Qgb2YgdGhlIHNhbWUgbmFtZVxuICAgKiB0aGUgZXhjbHVzaXZlIHRlc3QgaXMgcmVtb3ZlZCBhbmQgZnVydGhlciB0ZXN0cyBvZiB0aGUgc2FtZSBuYW1lIHdpbGwgYmUgc3RhY2tlZC5cbiAgICpcbiAgICogSWYgYW4gZXhjbHVzaXZlIHRlc3QgaXMgYWRkZWQgdG8gYSBzY2hlbWEgd2l0aCBub24tZXhjbHVzaXZlIHRlc3RzIG9mIHRoZSBzYW1lIG5hbWVcbiAgICogdGhlIHByZXZpb3VzIHRlc3RzIGFyZSByZW1vdmVkIGFuZCBmdXJ0aGVyIHRlc3RzIG9mIHRoZSBzYW1lIG5hbWUgd2lsbCByZXBsYWNlIGVhY2ggb3RoZXIuXG4gICAqL1xuXG5cbiAgdGVzdCguLi5hcmdzKSB7XG4gICAgbGV0IG9wdHM7XG5cbiAgICBpZiAoYXJncy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBvcHRzID0ge1xuICAgICAgICAgIHRlc3Q6IGFyZ3NbMF1cbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdHMgPSBhcmdzWzBdO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoYXJncy5sZW5ndGggPT09IDIpIHtcbiAgICAgIG9wdHMgPSB7XG4gICAgICAgIG5hbWU6IGFyZ3NbMF0sXG4gICAgICAgIHRlc3Q6IGFyZ3NbMV1cbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wdHMgPSB7XG4gICAgICAgIG5hbWU6IGFyZ3NbMF0sXG4gICAgICAgIG1lc3NhZ2U6IGFyZ3NbMV0sXG4gICAgICAgIHRlc3Q6IGFyZ3NbMl1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG9wdHMubWVzc2FnZSA9PT0gdW5kZWZpbmVkKSBvcHRzLm1lc3NhZ2UgPSBsb2NhbGUuZGVmYXVsdDtcbiAgICBpZiAodHlwZW9mIG9wdHMudGVzdCAhPT0gJ2Z1bmN0aW9uJykgdGhyb3cgbmV3IFR5cGVFcnJvcignYHRlc3RgIGlzIGEgcmVxdWlyZWQgcGFyYW1ldGVycycpO1xuICAgIGxldCBuZXh0ID0gdGhpcy5jbG9uZSgpO1xuICAgIGxldCB2YWxpZGF0ZSA9IGNyZWF0ZVZhbGlkYXRpb24ob3B0cyk7XG4gICAgbGV0IGlzRXhjbHVzaXZlID0gb3B0cy5leGNsdXNpdmUgfHwgb3B0cy5uYW1lICYmIG5leHQuZXhjbHVzaXZlVGVzdHNbb3B0cy5uYW1lXSA9PT0gdHJ1ZTtcblxuICAgIGlmIChvcHRzLmV4Y2x1c2l2ZSkge1xuICAgICAgaWYgKCFvcHRzLm5hbWUpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4Y2x1c2l2ZSB0ZXN0cyBtdXN0IHByb3ZpZGUgYSB1bmlxdWUgYG5hbWVgIGlkZW50aWZ5aW5nIHRoZSB0ZXN0Jyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdHMubmFtZSkgbmV4dC5leGNsdXNpdmVUZXN0c1tvcHRzLm5hbWVdID0gISFvcHRzLmV4Y2x1c2l2ZTtcbiAgICBuZXh0LnRlc3RzID0gbmV4dC50ZXN0cy5maWx0ZXIoZm4gPT4ge1xuICAgICAgaWYgKGZuLk9QVElPTlMubmFtZSA9PT0gb3B0cy5uYW1lKSB7XG4gICAgICAgIGlmIChpc0V4Y2x1c2l2ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoZm4uT1BUSU9OUy50ZXN0ID09PSB2YWxpZGF0ZS5PUFRJT05TLnRlc3QpIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gICAgbmV4dC50ZXN0cy5wdXNoKHZhbGlkYXRlKTtcbiAgICByZXR1cm4gbmV4dDtcbiAgfVxuXG4gIHdoZW4oa2V5cywgb3B0aW9ucykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlzKSAmJiB0eXBlb2Yga2V5cyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG9wdGlvbnMgPSBrZXlzO1xuICAgICAga2V5cyA9ICcuJztcbiAgICB9XG5cbiAgICBsZXQgbmV4dCA9IHRoaXMuY2xvbmUoKTtcbiAgICBsZXQgZGVwcyA9IHRvQXJyYXkoa2V5cykubWFwKGtleSA9PiBuZXcgUmVmKGtleSkpO1xuICAgIGRlcHMuZm9yRWFjaChkZXAgPT4ge1xuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgaWYgKGRlcC5pc1NpYmxpbmcpIG5leHQuZGVwcy5wdXNoKGRlcC5rZXkpO1xuICAgIH0pO1xuICAgIG5leHQuY29uZGl0aW9ucy5wdXNoKG5ldyBDb25kaXRpb24oZGVwcywgb3B0aW9ucykpO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgdHlwZUVycm9yKG1lc3NhZ2UpIHtcbiAgICB2YXIgbmV4dCA9IHRoaXMuY2xvbmUoKTtcbiAgICBuZXh0Ll90eXBlRXJyb3IgPSBjcmVhdGVWYWxpZGF0aW9uKHtcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBuYW1lOiAndHlwZUVycm9yJyxcblxuICAgICAgdGVzdCh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5zY2hlbWEuaXNUeXBlKHZhbHVlKSkgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3Ioe1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgdHlwZTogdGhpcy5zY2hlbWEuX3R5cGVcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgb25lT2YoZW51bXMsIG1lc3NhZ2UgPSBsb2NhbGUub25lT2YpIHtcbiAgICB2YXIgbmV4dCA9IHRoaXMuY2xvbmUoKTtcbiAgICBlbnVtcy5mb3JFYWNoKHZhbCA9PiB7XG4gICAgICBuZXh0Ll93aGl0ZWxpc3QuYWRkKHZhbCk7XG5cbiAgICAgIG5leHQuX2JsYWNrbGlzdC5kZWxldGUodmFsKTtcbiAgICB9KTtcbiAgICBuZXh0Ll93aGl0ZWxpc3RFcnJvciA9IGNyZWF0ZVZhbGlkYXRpb24oe1xuICAgICAgbWVzc2FnZSxcbiAgICAgIG5hbWU6ICdvbmVPZicsXG5cbiAgICAgIHRlc3QodmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHJldHVybiB0cnVlO1xuICAgICAgICBsZXQgdmFsaWRzID0gdGhpcy5zY2hlbWEuX3doaXRlbGlzdDtcbiAgICAgICAgcmV0dXJuIHZhbGlkcy5oYXModmFsdWUsIHRoaXMucmVzb2x2ZSkgPyB0cnVlIDogdGhpcy5jcmVhdGVFcnJvcih7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICB2YWx1ZXM6IHZhbGlkcy50b0FycmF5KCkuam9pbignLCAnKVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgICByZXR1cm4gbmV4dDtcbiAgfVxuXG4gIG5vdE9uZU9mKGVudW1zLCBtZXNzYWdlID0gbG9jYWxlLm5vdE9uZU9mKSB7XG4gICAgdmFyIG5leHQgPSB0aGlzLmNsb25lKCk7XG4gICAgZW51bXMuZm9yRWFjaCh2YWwgPT4ge1xuICAgICAgbmV4dC5fYmxhY2tsaXN0LmFkZCh2YWwpO1xuXG4gICAgICBuZXh0Ll93aGl0ZWxpc3QuZGVsZXRlKHZhbCk7XG4gICAgfSk7XG4gICAgbmV4dC5fYmxhY2tsaXN0RXJyb3IgPSBjcmVhdGVWYWxpZGF0aW9uKHtcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBuYW1lOiAnbm90T25lT2YnLFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIGxldCBpbnZhbGlkcyA9IHRoaXMuc2NoZW1hLl9ibGFja2xpc3Q7XG4gICAgICAgIGlmIChpbnZhbGlkcy5oYXModmFsdWUsIHRoaXMucmVzb2x2ZSkpIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHZhbHVlczogaW52YWxpZHMudG9BcnJheSgpLmpvaW4oJywgJylcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgc3RyaXAoc3RyaXAgPSB0cnVlKSB7XG4gICAgbGV0IG5leHQgPSB0aGlzLmNsb25lKCk7XG4gICAgbmV4dC5zcGVjLnN0cmlwID0gc3RyaXA7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH1cblxuICBkZXNjcmliZSgpIHtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy5jbG9uZSgpO1xuICAgIGNvbnN0IHtcbiAgICAgIGxhYmVsLFxuICAgICAgbWV0YVxuICAgIH0gPSBuZXh0LnNwZWM7XG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB7XG4gICAgICBtZXRhLFxuICAgICAgbGFiZWwsXG4gICAgICB0eXBlOiBuZXh0LnR5cGUsXG4gICAgICBvbmVPZjogbmV4dC5fd2hpdGVsaXN0LmRlc2NyaWJlKCksXG4gICAgICBub3RPbmVPZjogbmV4dC5fYmxhY2tsaXN0LmRlc2NyaWJlKCksXG4gICAgICB0ZXN0czogbmV4dC50ZXN0cy5tYXAoZm4gPT4gKHtcbiAgICAgICAgbmFtZTogZm4uT1BUSU9OUy5uYW1lLFxuICAgICAgICBwYXJhbXM6IGZuLk9QVElPTlMucGFyYW1zXG4gICAgICB9KSkuZmlsdGVyKChuLCBpZHgsIGxpc3QpID0+IGxpc3QuZmluZEluZGV4KGMgPT4gYy5uYW1lID09PSBuLm5hbWUpID09PSBpZHgpXG4gICAgfTtcbiAgICByZXR1cm4gZGVzY3JpcHRpb247XG4gIH1cblxufVxuLy8gQHRzLWV4cGVjdC1lcnJvclxuQmFzZVNjaGVtYS5wcm90b3R5cGUuX19pc1l1cFNjaGVtYV9fID0gdHJ1ZTtcblxuZm9yIChjb25zdCBtZXRob2Qgb2YgWyd2YWxpZGF0ZScsICd2YWxpZGF0ZVN5bmMnXSkgQmFzZVNjaGVtYS5wcm90b3R5cGVbYCR7bWV0aG9kfUF0YF0gPSBmdW5jdGlvbiAocGF0aCwgdmFsdWUsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCB7XG4gICAgcGFyZW50LFxuICAgIHBhcmVudFBhdGgsXG4gICAgc2NoZW1hXG4gIH0gPSBnZXRJbih0aGlzLCBwYXRoLCB2YWx1ZSwgb3B0aW9ucy5jb250ZXh0KTtcbiAgcmV0dXJuIHNjaGVtYVttZXRob2RdKHBhcmVudCAmJiBwYXJlbnRbcGFyZW50UGF0aF0sIF9leHRlbmRzKHt9LCBvcHRpb25zLCB7XG4gICAgcGFyZW50LFxuICAgIHBhdGhcbiAgfSkpO1xufTtcblxuZm9yIChjb25zdCBhbGlhcyBvZiBbJ2VxdWFscycsICdpcyddKSBCYXNlU2NoZW1hLnByb3RvdHlwZVthbGlhc10gPSBCYXNlU2NoZW1hLnByb3RvdHlwZS5vbmVPZjtcblxuZm9yIChjb25zdCBhbGlhcyBvZiBbJ25vdCcsICdub3BlJ10pIEJhc2VTY2hlbWEucHJvdG90eXBlW2FsaWFzXSA9IEJhc2VTY2hlbWEucHJvdG90eXBlLm5vdE9uZU9mO1xuXG5CYXNlU2NoZW1hLnByb3RvdHlwZS5vcHRpb25hbCA9IEJhc2VTY2hlbWEucHJvdG90eXBlLm5vdFJlcXVpcmVkOyIsImV4cG9ydCBkZWZhdWx0ICh2YWx1ZSA9PiB2YWx1ZSA9PSBudWxsKTsiLCJpbXBvcnQgeyBzdHJpbmcgYXMgbG9jYWxlIH0gZnJvbSAnLi9sb2NhbGUnO1xuaW1wb3J0IGlzQWJzZW50IGZyb20gJy4vdXRpbC9pc0Fic2VudCc7XG5pbXBvcnQgQmFzZVNjaGVtYSBmcm9tICcuL3NjaGVtYSc7IC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuXG5sZXQgckVtYWlsID0gL14oKChbYS16XXxcXGR8WyEjXFwkJSYnXFwqXFwrXFwtXFwvPVxcP1xcXl9ge1xcfH1+XXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkrKFxcLihbYS16XXxcXGR8WyEjXFwkJSYnXFwqXFwrXFwtXFwvPVxcP1xcXl9ge1xcfH1+XXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkrKSopfCgoXFx4MjIpKCgoKFxceDIwfFxceDA5KSooXFx4MGRcXHgwYSkpPyhcXHgyMHxcXHgwOSkrKT8oKFtcXHgwMS1cXHgwOFxceDBiXFx4MGNcXHgwZS1cXHgxZlxceDdmXXxcXHgyMXxbXFx4MjMtXFx4NWJdfFtcXHg1ZC1cXHg3ZV18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfChcXFxcKFtcXHgwMS1cXHgwOVxceDBiXFx4MGNcXHgwZC1cXHg3Zl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSkpKigoKFxceDIwfFxceDA5KSooXFx4MGRcXHgwYSkpPyhcXHgyMHxcXHgwOSkrKT8oXFx4MjIpKSlAKCgoW2Etel18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkoW2Etel18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkqKFthLXpdfFxcZHxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkpKVxcLikrKChbYS16XXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KChbYS16XXxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkoW2Etel18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSkqKFthLXpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpJC9pOyAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcblxubGV0IHJVcmwgPSAvXigoaHR0cHM/fGZ0cCk6KT9cXC9cXC8oKCgoW2Etel18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OikqQCk/KCgoXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pKXwoKChbYS16XXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2Etel18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16XXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2Etel18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuKSsoKFthLXpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16XXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2Etel18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4/KSg6XFxkKik/KShcXC8oKChbYS16XXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKyhcXC8oKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkqKSopPyk/KFxcPygoKFthLXpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8W1xcdUUwMDAtXFx1RjhGRl18XFwvfFxcPykqKT8oXFwjKCgoW2Etel18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxcXC98XFw/KSopPyQvaTsgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG5cbmxldCByVVVJRCA9IC9eKD86WzAtOWEtZl17OH0tWzAtOWEtZl17NH0tWzEtNV1bMC05YS1mXXszfS1bODlhYl1bMC05YS1mXXszfS1bMC05YS1mXXsxMn18MDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwKSQvaTtcblxubGV0IGlzVHJpbW1lZCA9IHZhbHVlID0+IGlzQWJzZW50KHZhbHVlKSB8fCB2YWx1ZSA9PT0gdmFsdWUudHJpbSgpO1xuXG5sZXQgb2JqU3RyaW5nVGFnID0ge30udG9TdHJpbmcoKTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUoKSB7XG4gIHJldHVybiBuZXcgU3RyaW5nU2NoZW1hKCk7XG59XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdHJpbmdTY2hlbWEgZXh0ZW5kcyBCYXNlU2NoZW1hIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICB9KTtcbiAgICB0aGlzLndpdGhNdXRhdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLnRyYW5zZm9ybShmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNUeXBlKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgY29uc3Qgc3RyVmFsdWUgPSB2YWx1ZSAhPSBudWxsICYmIHZhbHVlLnRvU3RyaW5nID8gdmFsdWUudG9TdHJpbmcoKSA6IHZhbHVlO1xuICAgICAgICBpZiAoc3RyVmFsdWUgPT09IG9ialN0cmluZ1RhZykgcmV0dXJuIHZhbHVlO1xuICAgICAgICByZXR1cm4gc3RyVmFsdWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF90eXBlQ2hlY2sodmFsdWUpIHtcbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcpIHZhbHVlID0gdmFsdWUudmFsdWVPZigpO1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO1xuICB9XG5cbiAgX2lzUHJlc2VudCh2YWx1ZSkge1xuICAgIHJldHVybiBzdXBlci5faXNQcmVzZW50KHZhbHVlKSAmJiAhIXZhbHVlLmxlbmd0aDtcbiAgfVxuXG4gIGxlbmd0aChsZW5ndGgsIG1lc3NhZ2UgPSBsb2NhbGUubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRoaXMudGVzdCh7XG4gICAgICBtZXNzYWdlLFxuICAgICAgbmFtZTogJ2xlbmd0aCcsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgbGVuZ3RoXG4gICAgICB9LFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoID09PSB0aGlzLnJlc29sdmUobGVuZ3RoKTtcbiAgICAgIH1cblxuICAgIH0pO1xuICB9XG5cbiAgbWluKG1pbiwgbWVzc2FnZSA9IGxvY2FsZS5taW4pIHtcbiAgICByZXR1cm4gdGhpcy50ZXN0KHtcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBuYW1lOiAnbWluJyxcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBtaW5cbiAgICAgIH0sXG5cbiAgICAgIHRlc3QodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGlzQWJzZW50KHZhbHVlKSB8fCB2YWx1ZS5sZW5ndGggPj0gdGhpcy5yZXNvbHZlKG1pbik7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfVxuXG4gIG1heChtYXgsIG1lc3NhZ2UgPSBsb2NhbGUubWF4KSB7XG4gICAgcmV0dXJuIHRoaXMudGVzdCh7XG4gICAgICBuYW1lOiAnbWF4JyxcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgbWF4XG4gICAgICB9LFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoIDw9IHRoaXMucmVzb2x2ZShtYXgpO1xuICAgICAgfVxuXG4gICAgfSk7XG4gIH1cblxuICBtYXRjaGVzKHJlZ2V4LCBvcHRpb25zKSB7XG4gICAgbGV0IGV4Y2x1ZGVFbXB0eVN0cmluZyA9IGZhbHNlO1xuICAgIGxldCBtZXNzYWdlO1xuICAgIGxldCBuYW1lO1xuXG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgKHtcbiAgICAgICAgICBleGNsdWRlRW1wdHlTdHJpbmcgPSBmYWxzZSxcbiAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgIG5hbWVcbiAgICAgICAgfSA9IG9wdGlvbnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZSA9IG9wdGlvbnM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudGVzdCh7XG4gICAgICBuYW1lOiBuYW1lIHx8ICdtYXRjaGVzJyxcbiAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UgfHwgbG9jYWxlLm1hdGNoZXMsXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcmVnZXhcbiAgICAgIH0sXG4gICAgICB0ZXN0OiB2YWx1ZSA9PiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUgPT09ICcnICYmIGV4Y2x1ZGVFbXB0eVN0cmluZyB8fCB2YWx1ZS5zZWFyY2gocmVnZXgpICE9PSAtMVxuICAgIH0pO1xuICB9XG5cbiAgZW1haWwobWVzc2FnZSA9IGxvY2FsZS5lbWFpbCkge1xuICAgIHJldHVybiB0aGlzLm1hdGNoZXMockVtYWlsLCB7XG4gICAgICBuYW1lOiAnZW1haWwnLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIGV4Y2x1ZGVFbXB0eVN0cmluZzogdHJ1ZVxuICAgIH0pO1xuICB9XG5cbiAgdXJsKG1lc3NhZ2UgPSBsb2NhbGUudXJsKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2hlcyhyVXJsLCB7XG4gICAgICBuYW1lOiAndXJsJyxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBleGNsdWRlRW1wdHlTdHJpbmc6IHRydWVcbiAgICB9KTtcbiAgfVxuXG4gIHV1aWQobWVzc2FnZSA9IGxvY2FsZS51dWlkKSB7XG4gICAgcmV0dXJuIHRoaXMubWF0Y2hlcyhyVVVJRCwge1xuICAgICAgbmFtZTogJ3V1aWQnLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIGV4Y2x1ZGVFbXB0eVN0cmluZzogZmFsc2VcbiAgICB9KTtcbiAgfSAvLy0tIHRyYW5zZm9ybXMgLS1cblxuXG4gIGVuc3VyZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kZWZhdWx0KCcnKS50cmFuc2Zvcm0odmFsID0+IHZhbCA9PT0gbnVsbCA/ICcnIDogdmFsKTtcbiAgfVxuXG4gIHRyaW0obWVzc2FnZSA9IGxvY2FsZS50cmltKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKHZhbCA9PiB2YWwgIT0gbnVsbCA/IHZhbC50cmltKCkgOiB2YWwpLnRlc3Qoe1xuICAgICAgbWVzc2FnZSxcbiAgICAgIG5hbWU6ICd0cmltJyxcbiAgICAgIHRlc3Q6IGlzVHJpbW1lZFxuICAgIH0pO1xuICB9XG5cbiAgbG93ZXJjYXNlKG1lc3NhZ2UgPSBsb2NhbGUubG93ZXJjYXNlKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKHZhbHVlID0+ICFpc0Fic2VudCh2YWx1ZSkgPyB2YWx1ZS50b0xvd2VyQ2FzZSgpIDogdmFsdWUpLnRlc3Qoe1xuICAgICAgbWVzc2FnZSxcbiAgICAgIG5hbWU6ICdzdHJpbmdfY2FzZScsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICB0ZXN0OiB2YWx1ZSA9PiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUgPT09IHZhbHVlLnRvTG93ZXJDYXNlKClcbiAgICB9KTtcbiAgfVxuXG4gIHVwcGVyY2FzZShtZXNzYWdlID0gbG9jYWxlLnVwcGVyY2FzZSkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybSh2YWx1ZSA9PiAhaXNBYnNlbnQodmFsdWUpID8gdmFsdWUudG9VcHBlckNhc2UoKSA6IHZhbHVlKS50ZXN0KHtcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBuYW1lOiAnc3RyaW5nX2Nhc2UnLFxuICAgICAgZXhjbHVzaXZlOiB0cnVlLFxuICAgICAgdGVzdDogdmFsdWUgPT4gaXNBYnNlbnQodmFsdWUpIHx8IHZhbHVlID09PSB2YWx1ZS50b1VwcGVyQ2FzZSgpXG4gICAgfSk7XG4gIH1cblxufVxuY3JlYXRlLnByb3RvdHlwZSA9IFN0cmluZ1NjaGVtYS5wcm90b3R5cGU7IC8vXG4vLyBTdHJpbmcgSW50ZXJmYWNlc1xuLy8iLCJpbXBvcnQgeyBudW1iZXIgYXMgbG9jYWxlIH0gZnJvbSAnLi9sb2NhbGUnO1xuaW1wb3J0IGlzQWJzZW50IGZyb20gJy4vdXRpbC9pc0Fic2VudCc7XG5pbXBvcnQgQmFzZVNjaGVtYSBmcm9tICcuL3NjaGVtYSc7XG5cbmxldCBpc05hTiA9IHZhbHVlID0+IHZhbHVlICE9ICt2YWx1ZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZSgpIHtcbiAgcmV0dXJuIG5ldyBOdW1iZXJTY2hlbWEoKTtcbn1cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE51bWJlclNjaGVtYSBleHRlbmRzIEJhc2VTY2hlbWEge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnbnVtYmVyJ1xuICAgIH0pO1xuICAgIHRoaXMud2l0aE11dGF0aW9uKCgpID0+IHtcbiAgICAgIHRoaXMudHJhbnNmb3JtKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBsZXQgcGFyc2VkID0gdmFsdWU7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBwYXJzZWQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgcGFyc2VkID0gcGFyc2VkLnJlcGxhY2UoL1xccy9nLCAnJyk7XG4gICAgICAgICAgaWYgKHBhcnNlZCA9PT0gJycpIHJldHVybiBOYU47IC8vIGRvbid0IHVzZSBwYXJzZUZsb2F0IHRvIGF2b2lkIHBvc2l0aXZlcyBvbiBhbHBoYS1udW1lcmljIHN0cmluZ3NcblxuICAgICAgICAgIHBhcnNlZCA9ICtwYXJzZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1R5cGUocGFyc2VkKSkgcmV0dXJuIHBhcnNlZDtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQocGFyc2VkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgX3R5cGVDaGVjayh2YWx1ZSkge1xuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE51bWJlcikgdmFsdWUgPSB2YWx1ZS52YWx1ZU9mKCk7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzTmFOKHZhbHVlKTtcbiAgfVxuXG4gIG1pbihtaW4sIG1lc3NhZ2UgPSBsb2NhbGUubWluKSB7XG4gICAgcmV0dXJuIHRoaXMudGVzdCh7XG4gICAgICBtZXNzYWdlLFxuICAgICAgbmFtZTogJ21pbicsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgbWluXG4gICAgICB9LFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUgPj0gdGhpcy5yZXNvbHZlKG1pbik7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfVxuXG4gIG1heChtYXgsIG1lc3NhZ2UgPSBsb2NhbGUubWF4KSB7XG4gICAgcmV0dXJuIHRoaXMudGVzdCh7XG4gICAgICBtZXNzYWdlLFxuICAgICAgbmFtZTogJ21heCcsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgbWF4XG4gICAgICB9LFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUgPD0gdGhpcy5yZXNvbHZlKG1heCk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfVxuXG4gIGxlc3NUaGFuKGxlc3MsIG1lc3NhZ2UgPSBsb2NhbGUubGVzc1RoYW4pIHtcbiAgICByZXR1cm4gdGhpcy50ZXN0KHtcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBuYW1lOiAnbWF4JyxcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBsZXNzXG4gICAgICB9LFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUgPCB0aGlzLnJlc29sdmUobGVzcyk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfVxuXG4gIG1vcmVUaGFuKG1vcmUsIG1lc3NhZ2UgPSBsb2NhbGUubW9yZVRoYW4pIHtcbiAgICByZXR1cm4gdGhpcy50ZXN0KHtcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBuYW1lOiAnbWluJyxcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBtb3JlXG4gICAgICB9LFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBpc0Fic2VudCh2YWx1ZSkgfHwgdmFsdWUgPiB0aGlzLnJlc29sdmUobW9yZSk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgfVxuXG4gIHBvc2l0aXZlKG1zZyA9IGxvY2FsZS5wb3NpdGl2ZSkge1xuICAgIHJldHVybiB0aGlzLm1vcmVUaGFuKDAsIG1zZyk7XG4gIH1cblxuICBuZWdhdGl2ZShtc2cgPSBsb2NhbGUubmVnYXRpdmUpIHtcbiAgICByZXR1cm4gdGhpcy5sZXNzVGhhbigwLCBtc2cpO1xuICB9XG5cbiAgaW50ZWdlcihtZXNzYWdlID0gbG9jYWxlLmludGVnZXIpIHtcbiAgICByZXR1cm4gdGhpcy50ZXN0KHtcbiAgICAgIG5hbWU6ICdpbnRlZ2VyJyxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICB0ZXN0OiB2YWwgPT4gaXNBYnNlbnQodmFsKSB8fCBOdW1iZXIuaXNJbnRlZ2VyKHZhbClcbiAgICB9KTtcbiAgfVxuXG4gIHRydW5jYXRlKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybSh2YWx1ZSA9PiAhaXNBYnNlbnQodmFsdWUpID8gdmFsdWUgfCAwIDogdmFsdWUpO1xuICB9XG5cbiAgcm91bmQobWV0aG9kKSB7XG4gICAgdmFyIF9tZXRob2Q7XG5cbiAgICB2YXIgYXZhaWwgPSBbJ2NlaWwnLCAnZmxvb3InLCAncm91bmQnLCAndHJ1bmMnXTtcbiAgICBtZXRob2QgPSAoKF9tZXRob2QgPSBtZXRob2QpID09IG51bGwgPyB2b2lkIDAgOiBfbWV0aG9kLnRvTG93ZXJDYXNlKCkpIHx8ICdyb3VuZCc7IC8vIHRoaXMgZXhpc3RzIGZvciBzeW1lbXRyeSB3aXRoIHRoZSBuZXcgTWF0aC50cnVuY1xuXG4gICAgaWYgKG1ldGhvZCA9PT0gJ3RydW5jJykgcmV0dXJuIHRoaXMudHJ1bmNhdGUoKTtcbiAgICBpZiAoYXZhaWwuaW5kZXhPZihtZXRob2QudG9Mb3dlckNhc2UoKSkgPT09IC0xKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdPbmx5IHZhbGlkIG9wdGlvbnMgZm9yIHJvdW5kKCkgYXJlOiAnICsgYXZhaWwuam9pbignLCAnKSk7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKHZhbHVlID0+ICFpc0Fic2VudCh2YWx1ZSkgPyBNYXRoW21ldGhvZF0odmFsdWUpIDogdmFsdWUpO1xuICB9XG5cbn1cbmNyZWF0ZS5wcm90b3R5cGUgPSBOdW1iZXJTY2hlbWEucHJvdG90eXBlOyAvL1xuLy8gTnVtYmVyIEludGVyZmFjZXNcbi8vIiwiLyoqXG4gKiBBIHNwZWNpYWxpemVkIHZlcnNpb24gb2YgYF8ucmVkdWNlYCBmb3IgYXJyYXlzIHdpdGhvdXQgc3VwcG9ydCBmb3JcbiAqIGl0ZXJhdGVlIHNob3J0aGFuZHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IFthcnJheV0gVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGl0ZXJhdGVlIFRoZSBmdW5jdGlvbiBpbnZva2VkIHBlciBpdGVyYXRpb24uXG4gKiBAcGFyYW0geyp9IFthY2N1bXVsYXRvcl0gVGhlIGluaXRpYWwgdmFsdWUuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpbml0QWNjdW1dIFNwZWNpZnkgdXNpbmcgdGhlIGZpcnN0IGVsZW1lbnQgb2YgYGFycmF5YCBhc1xuICogIHRoZSBpbml0aWFsIHZhbHVlLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGFjY3VtdWxhdGVkIHZhbHVlLlxuICovXG5mdW5jdGlvbiBhcnJheVJlZHVjZShhcnJheSwgaXRlcmF0ZWUsIGFjY3VtdWxhdG9yLCBpbml0QWNjdW0pIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheSA9PSBudWxsID8gMCA6IGFycmF5Lmxlbmd0aDtcblxuICBpZiAoaW5pdEFjY3VtICYmIGxlbmd0aCkge1xuICAgIGFjY3VtdWxhdG9yID0gYXJyYXlbKytpbmRleF07XG4gIH1cbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICBhY2N1bXVsYXRvciA9IGl0ZXJhdGVlKGFjY3VtdWxhdG9yLCBhcnJheVtpbmRleF0sIGluZGV4LCBhcnJheSk7XG4gIH1cbiAgcmV0dXJuIGFjY3VtdWxhdG9yO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5UmVkdWNlO1xuIiwiLyoqXG4gKiBUaGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBvZiBgXy5wcm9wZXJ0eU9mYCB3aXRob3V0IHN1cHBvcnQgZm9yIGRlZXAgcGF0aHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGFjY2Vzc29yIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiBiYXNlUHJvcGVydHlPZihvYmplY3QpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGtleSkge1xuICAgIHJldHVybiBvYmplY3QgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IG9iamVjdFtrZXldO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VQcm9wZXJ0eU9mO1xuIiwidmFyIGJhc2VQcm9wZXJ0eU9mID0gcmVxdWlyZSgnLi9fYmFzZVByb3BlcnR5T2YnKTtcblxuLyoqIFVzZWQgdG8gbWFwIExhdGluIFVuaWNvZGUgbGV0dGVycyB0byBiYXNpYyBMYXRpbiBsZXR0ZXJzLiAqL1xudmFyIGRlYnVycmVkTGV0dGVycyA9IHtcbiAgLy8gTGF0aW4tMSBTdXBwbGVtZW50IGJsb2NrLlxuICAnXFx4YzAnOiAnQScsICAnXFx4YzEnOiAnQScsICdcXHhjMic6ICdBJywgJ1xceGMzJzogJ0EnLCAnXFx4YzQnOiAnQScsICdcXHhjNSc6ICdBJyxcbiAgJ1xceGUwJzogJ2EnLCAgJ1xceGUxJzogJ2EnLCAnXFx4ZTInOiAnYScsICdcXHhlMyc6ICdhJywgJ1xceGU0JzogJ2EnLCAnXFx4ZTUnOiAnYScsXG4gICdcXHhjNyc6ICdDJywgICdcXHhlNyc6ICdjJyxcbiAgJ1xceGQwJzogJ0QnLCAgJ1xceGYwJzogJ2QnLFxuICAnXFx4YzgnOiAnRScsICAnXFx4YzknOiAnRScsICdcXHhjYSc6ICdFJywgJ1xceGNiJzogJ0UnLFxuICAnXFx4ZTgnOiAnZScsICAnXFx4ZTknOiAnZScsICdcXHhlYSc6ICdlJywgJ1xceGViJzogJ2UnLFxuICAnXFx4Y2MnOiAnSScsICAnXFx4Y2QnOiAnSScsICdcXHhjZSc6ICdJJywgJ1xceGNmJzogJ0knLFxuICAnXFx4ZWMnOiAnaScsICAnXFx4ZWQnOiAnaScsICdcXHhlZSc6ICdpJywgJ1xceGVmJzogJ2knLFxuICAnXFx4ZDEnOiAnTicsICAnXFx4ZjEnOiAnbicsXG4gICdcXHhkMic6ICdPJywgICdcXHhkMyc6ICdPJywgJ1xceGQ0JzogJ08nLCAnXFx4ZDUnOiAnTycsICdcXHhkNic6ICdPJywgJ1xceGQ4JzogJ08nLFxuICAnXFx4ZjInOiAnbycsICAnXFx4ZjMnOiAnbycsICdcXHhmNCc6ICdvJywgJ1xceGY1JzogJ28nLCAnXFx4ZjYnOiAnbycsICdcXHhmOCc6ICdvJyxcbiAgJ1xceGQ5JzogJ1UnLCAgJ1xceGRhJzogJ1UnLCAnXFx4ZGInOiAnVScsICdcXHhkYyc6ICdVJyxcbiAgJ1xceGY5JzogJ3UnLCAgJ1xceGZhJzogJ3UnLCAnXFx4ZmInOiAndScsICdcXHhmYyc6ICd1JyxcbiAgJ1xceGRkJzogJ1knLCAgJ1xceGZkJzogJ3knLCAnXFx4ZmYnOiAneScsXG4gICdcXHhjNic6ICdBZScsICdcXHhlNic6ICdhZScsXG4gICdcXHhkZSc6ICdUaCcsICdcXHhmZSc6ICd0aCcsXG4gICdcXHhkZic6ICdzcycsXG4gIC8vIExhdGluIEV4dGVuZGVkLUEgYmxvY2suXG4gICdcXHUwMTAwJzogJ0EnLCAgJ1xcdTAxMDInOiAnQScsICdcXHUwMTA0JzogJ0EnLFxuICAnXFx1MDEwMSc6ICdhJywgICdcXHUwMTAzJzogJ2EnLCAnXFx1MDEwNSc6ICdhJyxcbiAgJ1xcdTAxMDYnOiAnQycsICAnXFx1MDEwOCc6ICdDJywgJ1xcdTAxMGEnOiAnQycsICdcXHUwMTBjJzogJ0MnLFxuICAnXFx1MDEwNyc6ICdjJywgICdcXHUwMTA5JzogJ2MnLCAnXFx1MDEwYic6ICdjJywgJ1xcdTAxMGQnOiAnYycsXG4gICdcXHUwMTBlJzogJ0QnLCAgJ1xcdTAxMTAnOiAnRCcsICdcXHUwMTBmJzogJ2QnLCAnXFx1MDExMSc6ICdkJyxcbiAgJ1xcdTAxMTInOiAnRScsICAnXFx1MDExNCc6ICdFJywgJ1xcdTAxMTYnOiAnRScsICdcXHUwMTE4JzogJ0UnLCAnXFx1MDExYSc6ICdFJyxcbiAgJ1xcdTAxMTMnOiAnZScsICAnXFx1MDExNSc6ICdlJywgJ1xcdTAxMTcnOiAnZScsICdcXHUwMTE5JzogJ2UnLCAnXFx1MDExYic6ICdlJyxcbiAgJ1xcdTAxMWMnOiAnRycsICAnXFx1MDExZSc6ICdHJywgJ1xcdTAxMjAnOiAnRycsICdcXHUwMTIyJzogJ0cnLFxuICAnXFx1MDExZCc6ICdnJywgICdcXHUwMTFmJzogJ2cnLCAnXFx1MDEyMSc6ICdnJywgJ1xcdTAxMjMnOiAnZycsXG4gICdcXHUwMTI0JzogJ0gnLCAgJ1xcdTAxMjYnOiAnSCcsICdcXHUwMTI1JzogJ2gnLCAnXFx1MDEyNyc6ICdoJyxcbiAgJ1xcdTAxMjgnOiAnSScsICAnXFx1MDEyYSc6ICdJJywgJ1xcdTAxMmMnOiAnSScsICdcXHUwMTJlJzogJ0knLCAnXFx1MDEzMCc6ICdJJyxcbiAgJ1xcdTAxMjknOiAnaScsICAnXFx1MDEyYic6ICdpJywgJ1xcdTAxMmQnOiAnaScsICdcXHUwMTJmJzogJ2knLCAnXFx1MDEzMSc6ICdpJyxcbiAgJ1xcdTAxMzQnOiAnSicsICAnXFx1MDEzNSc6ICdqJyxcbiAgJ1xcdTAxMzYnOiAnSycsICAnXFx1MDEzNyc6ICdrJywgJ1xcdTAxMzgnOiAnaycsXG4gICdcXHUwMTM5JzogJ0wnLCAgJ1xcdTAxM2InOiAnTCcsICdcXHUwMTNkJzogJ0wnLCAnXFx1MDEzZic6ICdMJywgJ1xcdTAxNDEnOiAnTCcsXG4gICdcXHUwMTNhJzogJ2wnLCAgJ1xcdTAxM2MnOiAnbCcsICdcXHUwMTNlJzogJ2wnLCAnXFx1MDE0MCc6ICdsJywgJ1xcdTAxNDInOiAnbCcsXG4gICdcXHUwMTQzJzogJ04nLCAgJ1xcdTAxNDUnOiAnTicsICdcXHUwMTQ3JzogJ04nLCAnXFx1MDE0YSc6ICdOJyxcbiAgJ1xcdTAxNDQnOiAnbicsICAnXFx1MDE0Nic6ICduJywgJ1xcdTAxNDgnOiAnbicsICdcXHUwMTRiJzogJ24nLFxuICAnXFx1MDE0Yyc6ICdPJywgICdcXHUwMTRlJzogJ08nLCAnXFx1MDE1MCc6ICdPJyxcbiAgJ1xcdTAxNGQnOiAnbycsICAnXFx1MDE0Zic6ICdvJywgJ1xcdTAxNTEnOiAnbycsXG4gICdcXHUwMTU0JzogJ1InLCAgJ1xcdTAxNTYnOiAnUicsICdcXHUwMTU4JzogJ1InLFxuICAnXFx1MDE1NSc6ICdyJywgICdcXHUwMTU3JzogJ3InLCAnXFx1MDE1OSc6ICdyJyxcbiAgJ1xcdTAxNWEnOiAnUycsICAnXFx1MDE1Yyc6ICdTJywgJ1xcdTAxNWUnOiAnUycsICdcXHUwMTYwJzogJ1MnLFxuICAnXFx1MDE1Yic6ICdzJywgICdcXHUwMTVkJzogJ3MnLCAnXFx1MDE1Zic6ICdzJywgJ1xcdTAxNjEnOiAncycsXG4gICdcXHUwMTYyJzogJ1QnLCAgJ1xcdTAxNjQnOiAnVCcsICdcXHUwMTY2JzogJ1QnLFxuICAnXFx1MDE2Myc6ICd0JywgICdcXHUwMTY1JzogJ3QnLCAnXFx1MDE2Nyc6ICd0JyxcbiAgJ1xcdTAxNjgnOiAnVScsICAnXFx1MDE2YSc6ICdVJywgJ1xcdTAxNmMnOiAnVScsICdcXHUwMTZlJzogJ1UnLCAnXFx1MDE3MCc6ICdVJywgJ1xcdTAxNzInOiAnVScsXG4gICdcXHUwMTY5JzogJ3UnLCAgJ1xcdTAxNmInOiAndScsICdcXHUwMTZkJzogJ3UnLCAnXFx1MDE2Zic6ICd1JywgJ1xcdTAxNzEnOiAndScsICdcXHUwMTczJzogJ3UnLFxuICAnXFx1MDE3NCc6ICdXJywgICdcXHUwMTc1JzogJ3cnLFxuICAnXFx1MDE3Nic6ICdZJywgICdcXHUwMTc3JzogJ3knLCAnXFx1MDE3OCc6ICdZJyxcbiAgJ1xcdTAxNzknOiAnWicsICAnXFx1MDE3Yic6ICdaJywgJ1xcdTAxN2QnOiAnWicsXG4gICdcXHUwMTdhJzogJ3onLCAgJ1xcdTAxN2MnOiAneicsICdcXHUwMTdlJzogJ3onLFxuICAnXFx1MDEzMic6ICdJSicsICdcXHUwMTMzJzogJ2lqJyxcbiAgJ1xcdTAxNTInOiAnT2UnLCAnXFx1MDE1Myc6ICdvZScsXG4gICdcXHUwMTQ5JzogXCInblwiLCAnXFx1MDE3Zic6ICdzJ1xufTtcblxuLyoqXG4gKiBVc2VkIGJ5IGBfLmRlYnVycmAgdG8gY29udmVydCBMYXRpbi0xIFN1cHBsZW1lbnQgYW5kIExhdGluIEV4dGVuZGVkLUFcbiAqIGxldHRlcnMgdG8gYmFzaWMgTGF0aW4gbGV0dGVycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IGxldHRlciBUaGUgbWF0Y2hlZCBsZXR0ZXIgdG8gZGVidXJyLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZGVidXJyZWQgbGV0dGVyLlxuICovXG52YXIgZGVidXJyTGV0dGVyID0gYmFzZVByb3BlcnR5T2YoZGVidXJyZWRMZXR0ZXJzKTtcblxubW9kdWxlLmV4cG9ydHMgPSBkZWJ1cnJMZXR0ZXI7XG4iLCJ2YXIgZGVidXJyTGV0dGVyID0gcmVxdWlyZSgnLi9fZGVidXJyTGV0dGVyJyksXG4gICAgdG9TdHJpbmcgPSByZXF1aXJlKCcuL3RvU3RyaW5nJyk7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIExhdGluIFVuaWNvZGUgbGV0dGVycyAoZXhjbHVkaW5nIG1hdGhlbWF0aWNhbCBvcGVyYXRvcnMpLiAqL1xudmFyIHJlTGF0aW4gPSAvW1xceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHhmZlxcdTAxMDAtXFx1MDE3Zl0vZztcblxuLyoqIFVzZWQgdG8gY29tcG9zZSB1bmljb2RlIGNoYXJhY3RlciBjbGFzc2VzLiAqL1xudmFyIHJzQ29tYm9NYXJrc1JhbmdlID0gJ1xcXFx1MDMwMC1cXFxcdTAzNmYnLFxuICAgIHJlQ29tYm9IYWxmTWFya3NSYW5nZSA9ICdcXFxcdWZlMjAtXFxcXHVmZTJmJyxcbiAgICByc0NvbWJvU3ltYm9sc1JhbmdlID0gJ1xcXFx1MjBkMC1cXFxcdTIwZmYnLFxuICAgIHJzQ29tYm9SYW5nZSA9IHJzQ29tYm9NYXJrc1JhbmdlICsgcmVDb21ib0hhbGZNYXJrc1JhbmdlICsgcnNDb21ib1N5bWJvbHNSYW5nZTtcblxuLyoqIFVzZWQgdG8gY29tcG9zZSB1bmljb2RlIGNhcHR1cmUgZ3JvdXBzLiAqL1xudmFyIHJzQ29tYm8gPSAnWycgKyByc0NvbWJvUmFuZ2UgKyAnXSc7XG5cbi8qKlxuICogVXNlZCB0byBtYXRjaCBbY29tYmluaW5nIGRpYWNyaXRpY2FsIG1hcmtzXShodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Db21iaW5pbmdfRGlhY3JpdGljYWxfTWFya3MpIGFuZFxuICogW2NvbWJpbmluZyBkaWFjcml0aWNhbCBtYXJrcyBmb3Igc3ltYm9sc10oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ29tYmluaW5nX0RpYWNyaXRpY2FsX01hcmtzX2Zvcl9TeW1ib2xzKS5cbiAqL1xudmFyIHJlQ29tYm9NYXJrID0gUmVnRXhwKHJzQ29tYm8sICdnJyk7XG5cbi8qKlxuICogRGVidXJycyBgc3RyaW5nYCBieSBjb252ZXJ0aW5nXG4gKiBbTGF0aW4tMSBTdXBwbGVtZW50XShodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MYXRpbi0xX1N1cHBsZW1lbnRfKFVuaWNvZGVfYmxvY2spI0NoYXJhY3Rlcl90YWJsZSlcbiAqIGFuZCBbTGF0aW4gRXh0ZW5kZWQtQV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGF0aW5fRXh0ZW5kZWQtQSlcbiAqIGxldHRlcnMgdG8gYmFzaWMgTGF0aW4gbGV0dGVycyBhbmQgcmVtb3ZpbmdcbiAqIFtjb21iaW5pbmcgZGlhY3JpdGljYWwgbWFya3NdKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NvbWJpbmluZ19EaWFjcml0aWNhbF9NYXJrcykuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAzLjAuMFxuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSBzdHJpbmcgdG8gZGVidXJyLlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgZGVidXJyZWQgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmRlYnVycignZMOpasOgIHZ1Jyk7XG4gKiAvLyA9PiAnZGVqYSB2dSdcbiAqL1xuZnVuY3Rpb24gZGVidXJyKHN0cmluZykge1xuICBzdHJpbmcgPSB0b1N0cmluZyhzdHJpbmcpO1xuICByZXR1cm4gc3RyaW5nICYmIHN0cmluZy5yZXBsYWNlKHJlTGF0aW4sIGRlYnVyckxldHRlcikucmVwbGFjZShyZUNvbWJvTWFyaywgJycpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlYnVycjtcbiIsIi8qKiBVc2VkIHRvIG1hdGNoIHdvcmRzIGNvbXBvc2VkIG9mIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzLiAqL1xudmFyIHJlQXNjaWlXb3JkID0gL1teXFx4MDAtXFx4MmZcXHgzYS1cXHg0MFxceDViLVxceDYwXFx4N2ItXFx4N2ZdKy9nO1xuXG4vKipcbiAqIFNwbGl0cyBhbiBBU0NJSSBgc3RyaW5nYCBpbnRvIGFuIGFycmF5IG9mIGl0cyB3b3Jkcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgd29yZHMgb2YgYHN0cmluZ2AuXG4gKi9cbmZ1bmN0aW9uIGFzY2lpV29yZHMoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcubWF0Y2gocmVBc2NpaVdvcmQpIHx8IFtdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzY2lpV29yZHM7XG4iLCIvKiogVXNlZCB0byBkZXRlY3Qgc3RyaW5ncyB0aGF0IG5lZWQgYSBtb3JlIHJvYnVzdCByZWdleHAgdG8gbWF0Y2ggd29yZHMuICovXG52YXIgcmVIYXNVbmljb2RlV29yZCA9IC9bYS16XVtBLVpdfFtBLVpdezJ9W2Etel18WzAtOV1bYS16QS1aXXxbYS16QS1aXVswLTldfFteYS16QS1aMC05IF0vO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgc3RyaW5nYCBjb250YWlucyBhIHdvcmQgY29tcG9zZWQgb2YgVW5pY29kZSBzeW1ib2xzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhIHdvcmQgaXMgZm91bmQsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaGFzVW5pY29kZVdvcmQoc3RyaW5nKSB7XG4gIHJldHVybiByZUhhc1VuaWNvZGVXb3JkLnRlc3Qoc3RyaW5nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoYXNVbmljb2RlV29yZDtcbiIsIi8qKiBVc2VkIHRvIGNvbXBvc2UgdW5pY29kZSBjaGFyYWN0ZXIgY2xhc3Nlcy4gKi9cbnZhciByc0FzdHJhbFJhbmdlID0gJ1xcXFx1ZDgwMC1cXFxcdWRmZmYnLFxuICAgIHJzQ29tYm9NYXJrc1JhbmdlID0gJ1xcXFx1MDMwMC1cXFxcdTAzNmYnLFxuICAgIHJlQ29tYm9IYWxmTWFya3NSYW5nZSA9ICdcXFxcdWZlMjAtXFxcXHVmZTJmJyxcbiAgICByc0NvbWJvU3ltYm9sc1JhbmdlID0gJ1xcXFx1MjBkMC1cXFxcdTIwZmYnLFxuICAgIHJzQ29tYm9SYW5nZSA9IHJzQ29tYm9NYXJrc1JhbmdlICsgcmVDb21ib0hhbGZNYXJrc1JhbmdlICsgcnNDb21ib1N5bWJvbHNSYW5nZSxcbiAgICByc0RpbmdiYXRSYW5nZSA9ICdcXFxcdTI3MDAtXFxcXHUyN2JmJyxcbiAgICByc0xvd2VyUmFuZ2UgPSAnYS16XFxcXHhkZi1cXFxceGY2XFxcXHhmOC1cXFxceGZmJyxcbiAgICByc01hdGhPcFJhbmdlID0gJ1xcXFx4YWNcXFxceGIxXFxcXHhkN1xcXFx4ZjcnLFxuICAgIHJzTm9uQ2hhclJhbmdlID0gJ1xcXFx4MDAtXFxcXHgyZlxcXFx4M2EtXFxcXHg0MFxcXFx4NWItXFxcXHg2MFxcXFx4N2ItXFxcXHhiZicsXG4gICAgcnNQdW5jdHVhdGlvblJhbmdlID0gJ1xcXFx1MjAwMC1cXFxcdTIwNmYnLFxuICAgIHJzU3BhY2VSYW5nZSA9ICcgXFxcXHRcXFxceDBiXFxcXGZcXFxceGEwXFxcXHVmZWZmXFxcXG5cXFxcclxcXFx1MjAyOFxcXFx1MjAyOVxcXFx1MTY4MFxcXFx1MTgwZVxcXFx1MjAwMFxcXFx1MjAwMVxcXFx1MjAwMlxcXFx1MjAwM1xcXFx1MjAwNFxcXFx1MjAwNVxcXFx1MjAwNlxcXFx1MjAwN1xcXFx1MjAwOFxcXFx1MjAwOVxcXFx1MjAwYVxcXFx1MjAyZlxcXFx1MjA1ZlxcXFx1MzAwMCcsXG4gICAgcnNVcHBlclJhbmdlID0gJ0EtWlxcXFx4YzAtXFxcXHhkNlxcXFx4ZDgtXFxcXHhkZScsXG4gICAgcnNWYXJSYW5nZSA9ICdcXFxcdWZlMGVcXFxcdWZlMGYnLFxuICAgIHJzQnJlYWtSYW5nZSA9IHJzTWF0aE9wUmFuZ2UgKyByc05vbkNoYXJSYW5nZSArIHJzUHVuY3R1YXRpb25SYW5nZSArIHJzU3BhY2VSYW5nZTtcblxuLyoqIFVzZWQgdG8gY29tcG9zZSB1bmljb2RlIGNhcHR1cmUgZ3JvdXBzLiAqL1xudmFyIHJzQXBvcyA9IFwiWydcXHUyMDE5XVwiLFxuICAgIHJzQnJlYWsgPSAnWycgKyByc0JyZWFrUmFuZ2UgKyAnXScsXG4gICAgcnNDb21ibyA9ICdbJyArIHJzQ29tYm9SYW5nZSArICddJyxcbiAgICByc0RpZ2l0cyA9ICdcXFxcZCsnLFxuICAgIHJzRGluZ2JhdCA9ICdbJyArIHJzRGluZ2JhdFJhbmdlICsgJ10nLFxuICAgIHJzTG93ZXIgPSAnWycgKyByc0xvd2VyUmFuZ2UgKyAnXScsXG4gICAgcnNNaXNjID0gJ1teJyArIHJzQXN0cmFsUmFuZ2UgKyByc0JyZWFrUmFuZ2UgKyByc0RpZ2l0cyArIHJzRGluZ2JhdFJhbmdlICsgcnNMb3dlclJhbmdlICsgcnNVcHBlclJhbmdlICsgJ10nLFxuICAgIHJzRml0eiA9ICdcXFxcdWQ4M2NbXFxcXHVkZmZiLVxcXFx1ZGZmZl0nLFxuICAgIHJzTW9kaWZpZXIgPSAnKD86JyArIHJzQ29tYm8gKyAnfCcgKyByc0ZpdHogKyAnKScsXG4gICAgcnNOb25Bc3RyYWwgPSAnW14nICsgcnNBc3RyYWxSYW5nZSArICddJyxcbiAgICByc1JlZ2lvbmFsID0gJyg/OlxcXFx1ZDgzY1tcXFxcdWRkZTYtXFxcXHVkZGZmXSl7Mn0nLFxuICAgIHJzU3VyclBhaXIgPSAnW1xcXFx1ZDgwMC1cXFxcdWRiZmZdW1xcXFx1ZGMwMC1cXFxcdWRmZmZdJyxcbiAgICByc1VwcGVyID0gJ1snICsgcnNVcHBlclJhbmdlICsgJ10nLFxuICAgIHJzWldKID0gJ1xcXFx1MjAwZCc7XG5cbi8qKiBVc2VkIHRvIGNvbXBvc2UgdW5pY29kZSByZWdleGVzLiAqL1xudmFyIHJzTWlzY0xvd2VyID0gJyg/OicgKyByc0xvd2VyICsgJ3wnICsgcnNNaXNjICsgJyknLFxuICAgIHJzTWlzY1VwcGVyID0gJyg/OicgKyByc1VwcGVyICsgJ3wnICsgcnNNaXNjICsgJyknLFxuICAgIHJzT3B0Q29udHJMb3dlciA9ICcoPzonICsgcnNBcG9zICsgJyg/OmR8bGx8bXxyZXxzfHR8dmUpKT8nLFxuICAgIHJzT3B0Q29udHJVcHBlciA9ICcoPzonICsgcnNBcG9zICsgJyg/OkR8TEx8TXxSRXxTfFR8VkUpKT8nLFxuICAgIHJlT3B0TW9kID0gcnNNb2RpZmllciArICc/JyxcbiAgICByc09wdFZhciA9ICdbJyArIHJzVmFyUmFuZ2UgKyAnXT8nLFxuICAgIHJzT3B0Sm9pbiA9ICcoPzonICsgcnNaV0ogKyAnKD86JyArIFtyc05vbkFzdHJhbCwgcnNSZWdpb25hbCwgcnNTdXJyUGFpcl0uam9pbignfCcpICsgJyknICsgcnNPcHRWYXIgKyByZU9wdE1vZCArICcpKicsXG4gICAgcnNPcmRMb3dlciA9ICdcXFxcZCooPzoxc3R8Mm5kfDNyZHwoPyFbMTIzXSlcXFxcZHRoKSg/PVxcXFxifFtBLVpfXSknLFxuICAgIHJzT3JkVXBwZXIgPSAnXFxcXGQqKD86MVNUfDJORHwzUkR8KD8hWzEyM10pXFxcXGRUSCkoPz1cXFxcYnxbYS16X10pJyxcbiAgICByc1NlcSA9IHJzT3B0VmFyICsgcmVPcHRNb2QgKyByc09wdEpvaW4sXG4gICAgcnNFbW9qaSA9ICcoPzonICsgW3JzRGluZ2JhdCwgcnNSZWdpb25hbCwgcnNTdXJyUGFpcl0uam9pbignfCcpICsgJyknICsgcnNTZXE7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGNvbXBsZXggb3IgY29tcG91bmQgd29yZHMuICovXG52YXIgcmVVbmljb2RlV29yZCA9IFJlZ0V4cChbXG4gIHJzVXBwZXIgKyAnPycgKyByc0xvd2VyICsgJysnICsgcnNPcHRDb250ckxvd2VyICsgJyg/PScgKyBbcnNCcmVhaywgcnNVcHBlciwgJyQnXS5qb2luKCd8JykgKyAnKScsXG4gIHJzTWlzY1VwcGVyICsgJysnICsgcnNPcHRDb250clVwcGVyICsgJyg/PScgKyBbcnNCcmVhaywgcnNVcHBlciArIHJzTWlzY0xvd2VyLCAnJCddLmpvaW4oJ3wnKSArICcpJyxcbiAgcnNVcHBlciArICc/JyArIHJzTWlzY0xvd2VyICsgJysnICsgcnNPcHRDb250ckxvd2VyLFxuICByc1VwcGVyICsgJysnICsgcnNPcHRDb250clVwcGVyLFxuICByc09yZFVwcGVyLFxuICByc09yZExvd2VyLFxuICByc0RpZ2l0cyxcbiAgcnNFbW9qaVxuXS5qb2luKCd8JyksICdnJyk7XG5cbi8qKlxuICogU3BsaXRzIGEgVW5pY29kZSBgc3RyaW5nYCBpbnRvIGFuIGFycmF5IG9mIGl0cyB3b3Jkcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IFRoZSBzdHJpbmcgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgd29yZHMgb2YgYHN0cmluZ2AuXG4gKi9cbmZ1bmN0aW9uIHVuaWNvZGVXb3JkcyhzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5tYXRjaChyZVVuaWNvZGVXb3JkKSB8fCBbXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB1bmljb2RlV29yZHM7XG4iLCJ2YXIgYXNjaWlXb3JkcyA9IHJlcXVpcmUoJy4vX2FzY2lpV29yZHMnKSxcbiAgICBoYXNVbmljb2RlV29yZCA9IHJlcXVpcmUoJy4vX2hhc1VuaWNvZGVXb3JkJyksXG4gICAgdG9TdHJpbmcgPSByZXF1aXJlKCcuL3RvU3RyaW5nJyksXG4gICAgdW5pY29kZVdvcmRzID0gcmVxdWlyZSgnLi9fdW5pY29kZVdvcmRzJyk7XG5cbi8qKlxuICogU3BsaXRzIGBzdHJpbmdgIGludG8gYW4gYXJyYXkgb2YgaXRzIHdvcmRzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4wLjBcbiAqIEBjYXRlZ29yeSBTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3RyaW5nPScnXSBUaGUgc3RyaW5nIHRvIGluc3BlY3QuXG4gKiBAcGFyYW0ge1JlZ0V4cHxzdHJpbmd9IFtwYXR0ZXJuXSBUaGUgcGF0dGVybiB0byBtYXRjaCB3b3Jkcy5cbiAqIEBwYXJhbS0ge09iamVjdH0gW2d1YXJkXSBFbmFibGVzIHVzZSBhcyBhbiBpdGVyYXRlZSBmb3IgbWV0aG9kcyBsaWtlIGBfLm1hcGAuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIHdvcmRzIG9mIGBzdHJpbmdgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLndvcmRzKCdmcmVkLCBiYXJuZXksICYgcGViYmxlcycpO1xuICogLy8gPT4gWydmcmVkJywgJ2Jhcm5leScsICdwZWJibGVzJ11cbiAqXG4gKiBfLndvcmRzKCdmcmVkLCBiYXJuZXksICYgcGViYmxlcycsIC9bXiwgXSsvZyk7XG4gKiAvLyA9PiBbJ2ZyZWQnLCAnYmFybmV5JywgJyYnLCAncGViYmxlcyddXG4gKi9cbmZ1bmN0aW9uIHdvcmRzKHN0cmluZywgcGF0dGVybiwgZ3VhcmQpIHtcbiAgc3RyaW5nID0gdG9TdHJpbmcoc3RyaW5nKTtcbiAgcGF0dGVybiA9IGd1YXJkID8gdW5kZWZpbmVkIDogcGF0dGVybjtcblxuICBpZiAocGF0dGVybiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIGhhc1VuaWNvZGVXb3JkKHN0cmluZykgPyB1bmljb2RlV29yZHMoc3RyaW5nKSA6IGFzY2lpV29yZHMoc3RyaW5nKTtcbiAgfVxuICByZXR1cm4gc3RyaW5nLm1hdGNoKHBhdHRlcm4pIHx8IFtdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdvcmRzO1xuIiwidmFyIGFycmF5UmVkdWNlID0gcmVxdWlyZSgnLi9fYXJyYXlSZWR1Y2UnKSxcbiAgICBkZWJ1cnIgPSByZXF1aXJlKCcuL2RlYnVycicpLFxuICAgIHdvcmRzID0gcmVxdWlyZSgnLi93b3JkcycpO1xuXG4vKiogVXNlZCB0byBjb21wb3NlIHVuaWNvZGUgY2FwdHVyZSBncm91cHMuICovXG52YXIgcnNBcG9zID0gXCJbJ1xcdTIwMTldXCI7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGFwb3N0cm9waGVzLiAqL1xudmFyIHJlQXBvcyA9IFJlZ0V4cChyc0Fwb3MsICdnJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIGxpa2UgYF8uY2FtZWxDYXNlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGNvbWJpbmUgZWFjaCB3b3JkLlxuICogQHJldHVybnMge0Z1bmN0aW9ufSBSZXR1cm5zIHRoZSBuZXcgY29tcG91bmRlciBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29tcG91bmRlcihjYWxsYmFjaykge1xuICByZXR1cm4gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgcmV0dXJuIGFycmF5UmVkdWNlKHdvcmRzKGRlYnVycihzdHJpbmcpLnJlcGxhY2UocmVBcG9zLCAnJykpLCBjYWxsYmFjaywgJycpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNvbXBvdW5kZXI7XG4iLCJ2YXIgY3JlYXRlQ29tcG91bmRlciA9IHJlcXVpcmUoJy4vX2NyZWF0ZUNvbXBvdW5kZXInKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgc3RyaW5nYCB0b1xuICogW3NuYWtlIGNhc2VdKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1NuYWtlX2Nhc2UpLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4wLjBcbiAqIEBjYXRlZ29yeSBTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3RyaW5nPScnXSBUaGUgc3RyaW5nIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzbmFrZSBjYXNlZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uc25ha2VDYXNlKCdGb28gQmFyJyk7XG4gKiAvLyA9PiAnZm9vX2JhcidcbiAqXG4gKiBfLnNuYWtlQ2FzZSgnZm9vQmFyJyk7XG4gKiAvLyA9PiAnZm9vX2JhcidcbiAqXG4gKiBfLnNuYWtlQ2FzZSgnLS1GT08tQkFSLS0nKTtcbiAqIC8vID0+ICdmb29fYmFyJ1xuICovXG52YXIgc25ha2VDYXNlID0gY3JlYXRlQ29tcG91bmRlcihmdW5jdGlvbihyZXN1bHQsIHdvcmQsIGluZGV4KSB7XG4gIHJldHVybiByZXN1bHQgKyAoaW5kZXggPyAnXycgOiAnJykgKyB3b3JkLnRvTG93ZXJDYXNlKCk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBzbmFrZUNhc2U7XG4iLCIvKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLnNsaWNlYCB3aXRob3V0IGFuIGl0ZXJhdGVlIGNhbGwgZ3VhcmQuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBzbGljZS5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnQ9MF0gVGhlIHN0YXJ0IHBvc2l0aW9uLlxuICogQHBhcmFtIHtudW1iZXJ9IFtlbmQ9YXJyYXkubGVuZ3RoXSBUaGUgZW5kIHBvc2l0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBzbGljZSBvZiBgYXJyYXlgLlxuICovXG5mdW5jdGlvbiBiYXNlU2xpY2UoYXJyYXksIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gLXN0YXJ0ID4gbGVuZ3RoID8gMCA6IChsZW5ndGggKyBzdGFydCk7XG4gIH1cbiAgZW5kID0gZW5kID4gbGVuZ3RoID8gbGVuZ3RoIDogZW5kO1xuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5ndGg7XG4gIH1cbiAgbGVuZ3RoID0gc3RhcnQgPiBlbmQgPyAwIDogKChlbmQgLSBzdGFydCkgPj4+IDApO1xuICBzdGFydCA+Pj49IDA7XG5cbiAgdmFyIHJlc3VsdCA9IEFycmF5KGxlbmd0aCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgcmVzdWx0W2luZGV4XSA9IGFycmF5W2luZGV4ICsgc3RhcnRdO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYmFzZVNsaWNlO1xuIiwidmFyIGJhc2VTbGljZSA9IHJlcXVpcmUoJy4vX2Jhc2VTbGljZScpO1xuXG4vKipcbiAqIENhc3RzIGBhcnJheWAgdG8gYSBzbGljZSBpZiBpdCdzIG5lZWRlZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnQgVGhlIHN0YXJ0IHBvc2l0aW9uLlxuICogQHBhcmFtIHtudW1iZXJ9IFtlbmQ9YXJyYXkubGVuZ3RoXSBUaGUgZW5kIHBvc2l0aW9uLlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBjYXN0IHNsaWNlLlxuICovXG5mdW5jdGlvbiBjYXN0U2xpY2UoYXJyYXksIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW5ndGggOiBlbmQ7XG4gIHJldHVybiAoIXN0YXJ0ICYmIGVuZCA+PSBsZW5ndGgpID8gYXJyYXkgOiBiYXNlU2xpY2UoYXJyYXksIHN0YXJ0LCBlbmQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNhc3RTbGljZTtcbiIsIi8qKiBVc2VkIHRvIGNvbXBvc2UgdW5pY29kZSBjaGFyYWN0ZXIgY2xhc3Nlcy4gKi9cbnZhciByc0FzdHJhbFJhbmdlID0gJ1xcXFx1ZDgwMC1cXFxcdWRmZmYnLFxuICAgIHJzQ29tYm9NYXJrc1JhbmdlID0gJ1xcXFx1MDMwMC1cXFxcdTAzNmYnLFxuICAgIHJlQ29tYm9IYWxmTWFya3NSYW5nZSA9ICdcXFxcdWZlMjAtXFxcXHVmZTJmJyxcbiAgICByc0NvbWJvU3ltYm9sc1JhbmdlID0gJ1xcXFx1MjBkMC1cXFxcdTIwZmYnLFxuICAgIHJzQ29tYm9SYW5nZSA9IHJzQ29tYm9NYXJrc1JhbmdlICsgcmVDb21ib0hhbGZNYXJrc1JhbmdlICsgcnNDb21ib1N5bWJvbHNSYW5nZSxcbiAgICByc1ZhclJhbmdlID0gJ1xcXFx1ZmUwZVxcXFx1ZmUwZic7XG5cbi8qKiBVc2VkIHRvIGNvbXBvc2UgdW5pY29kZSBjYXB0dXJlIGdyb3Vwcy4gKi9cbnZhciByc1pXSiA9ICdcXFxcdTIwMGQnO1xuXG4vKiogVXNlZCB0byBkZXRlY3Qgc3RyaW5ncyB3aXRoIFt6ZXJvLXdpZHRoIGpvaW5lcnMgb3IgY29kZSBwb2ludHMgZnJvbSB0aGUgYXN0cmFsIHBsYW5lc10oaHR0cDovL2Vldi5lZS9ibG9nLzIwMTUvMDkvMTIvZGFyay1jb3JuZXJzLW9mLXVuaWNvZGUvKS4gKi9cbnZhciByZUhhc1VuaWNvZGUgPSBSZWdFeHAoJ1snICsgcnNaV0ogKyByc0FzdHJhbFJhbmdlICArIHJzQ29tYm9SYW5nZSArIHJzVmFyUmFuZ2UgKyAnXScpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgc3RyaW5nYCBjb250YWlucyBVbmljb2RlIHN5bWJvbHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBpbnNwZWN0LlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGEgc3ltYm9sIGlzIGZvdW5kLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGhhc1VuaWNvZGUoc3RyaW5nKSB7XG4gIHJldHVybiByZUhhc1VuaWNvZGUudGVzdChzdHJpbmcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhhc1VuaWNvZGU7XG4iLCIvKipcbiAqIENvbnZlcnRzIGFuIEFTQ0lJIGBzdHJpbmdgIHRvIGFuIGFycmF5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY29udmVydGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBhc2NpaVRvQXJyYXkoc3RyaW5nKSB7XG4gIHJldHVybiBzdHJpbmcuc3BsaXQoJycpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFzY2lpVG9BcnJheTtcbiIsIi8qKiBVc2VkIHRvIGNvbXBvc2UgdW5pY29kZSBjaGFyYWN0ZXIgY2xhc3Nlcy4gKi9cbnZhciByc0FzdHJhbFJhbmdlID0gJ1xcXFx1ZDgwMC1cXFxcdWRmZmYnLFxuICAgIHJzQ29tYm9NYXJrc1JhbmdlID0gJ1xcXFx1MDMwMC1cXFxcdTAzNmYnLFxuICAgIHJlQ29tYm9IYWxmTWFya3NSYW5nZSA9ICdcXFxcdWZlMjAtXFxcXHVmZTJmJyxcbiAgICByc0NvbWJvU3ltYm9sc1JhbmdlID0gJ1xcXFx1MjBkMC1cXFxcdTIwZmYnLFxuICAgIHJzQ29tYm9SYW5nZSA9IHJzQ29tYm9NYXJrc1JhbmdlICsgcmVDb21ib0hhbGZNYXJrc1JhbmdlICsgcnNDb21ib1N5bWJvbHNSYW5nZSxcbiAgICByc1ZhclJhbmdlID0gJ1xcXFx1ZmUwZVxcXFx1ZmUwZic7XG5cbi8qKiBVc2VkIHRvIGNvbXBvc2UgdW5pY29kZSBjYXB0dXJlIGdyb3Vwcy4gKi9cbnZhciByc0FzdHJhbCA9ICdbJyArIHJzQXN0cmFsUmFuZ2UgKyAnXScsXG4gICAgcnNDb21ibyA9ICdbJyArIHJzQ29tYm9SYW5nZSArICddJyxcbiAgICByc0ZpdHogPSAnXFxcXHVkODNjW1xcXFx1ZGZmYi1cXFxcdWRmZmZdJyxcbiAgICByc01vZGlmaWVyID0gJyg/OicgKyByc0NvbWJvICsgJ3wnICsgcnNGaXR6ICsgJyknLFxuICAgIHJzTm9uQXN0cmFsID0gJ1teJyArIHJzQXN0cmFsUmFuZ2UgKyAnXScsXG4gICAgcnNSZWdpb25hbCA9ICcoPzpcXFxcdWQ4M2NbXFxcXHVkZGU2LVxcXFx1ZGRmZl0pezJ9JyxcbiAgICByc1N1cnJQYWlyID0gJ1tcXFxcdWQ4MDAtXFxcXHVkYmZmXVtcXFxcdWRjMDAtXFxcXHVkZmZmXScsXG4gICAgcnNaV0ogPSAnXFxcXHUyMDBkJztcblxuLyoqIFVzZWQgdG8gY29tcG9zZSB1bmljb2RlIHJlZ2V4ZXMuICovXG52YXIgcmVPcHRNb2QgPSByc01vZGlmaWVyICsgJz8nLFxuICAgIHJzT3B0VmFyID0gJ1snICsgcnNWYXJSYW5nZSArICddPycsXG4gICAgcnNPcHRKb2luID0gJyg/OicgKyByc1pXSiArICcoPzonICsgW3JzTm9uQXN0cmFsLCByc1JlZ2lvbmFsLCByc1N1cnJQYWlyXS5qb2luKCd8JykgKyAnKScgKyByc09wdFZhciArIHJlT3B0TW9kICsgJykqJyxcbiAgICByc1NlcSA9IHJzT3B0VmFyICsgcmVPcHRNb2QgKyByc09wdEpvaW4sXG4gICAgcnNTeW1ib2wgPSAnKD86JyArIFtyc05vbkFzdHJhbCArIHJzQ29tYm8gKyAnPycsIHJzQ29tYm8sIHJzUmVnaW9uYWwsIHJzU3VyclBhaXIsIHJzQXN0cmFsXS5qb2luKCd8JykgKyAnKSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIFtzdHJpbmcgc3ltYm9sc10oaHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtdW5pY29kZSkuICovXG52YXIgcmVVbmljb2RlID0gUmVnRXhwKHJzRml0eiArICcoPz0nICsgcnNGaXR6ICsgJyl8JyArIHJzU3ltYm9sICsgcnNTZXEsICdnJyk7XG5cbi8qKlxuICogQ29udmVydHMgYSBVbmljb2RlIGBzdHJpbmdgIHRvIGFuIGFycmF5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY29udmVydGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiB1bmljb2RlVG9BcnJheShzdHJpbmcpIHtcbiAgcmV0dXJuIHN0cmluZy5tYXRjaChyZVVuaWNvZGUpIHx8IFtdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuaWNvZGVUb0FycmF5O1xuIiwidmFyIGFzY2lpVG9BcnJheSA9IHJlcXVpcmUoJy4vX2FzY2lpVG9BcnJheScpLFxuICAgIGhhc1VuaWNvZGUgPSByZXF1aXJlKCcuL19oYXNVbmljb2RlJyksXG4gICAgdW5pY29kZVRvQXJyYXkgPSByZXF1aXJlKCcuL191bmljb2RlVG9BcnJheScpO1xuXG4vKipcbiAqIENvbnZlcnRzIGBzdHJpbmdgIHRvIGFuIGFycmF5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY29udmVydGVkIGFycmF5LlxuICovXG5mdW5jdGlvbiBzdHJpbmdUb0FycmF5KHN0cmluZykge1xuICByZXR1cm4gaGFzVW5pY29kZShzdHJpbmcpXG4gICAgPyB1bmljb2RlVG9BcnJheShzdHJpbmcpXG4gICAgOiBhc2NpaVRvQXJyYXkoc3RyaW5nKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdHJpbmdUb0FycmF5O1xuIiwidmFyIGNhc3RTbGljZSA9IHJlcXVpcmUoJy4vX2Nhc3RTbGljZScpLFxuICAgIGhhc1VuaWNvZGUgPSByZXF1aXJlKCcuL19oYXNVbmljb2RlJyksXG4gICAgc3RyaW5nVG9BcnJheSA9IHJlcXVpcmUoJy4vX3N0cmluZ1RvQXJyYXknKSxcbiAgICB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcnKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgZnVuY3Rpb24gbGlrZSBgXy5sb3dlckZpcnN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZE5hbWUgVGhlIG5hbWUgb2YgdGhlIGBTdHJpbmdgIGNhc2UgbWV0aG9kIHRvIHVzZS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IGNhc2UgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNhc2VGaXJzdChtZXRob2ROYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICBzdHJpbmcgPSB0b1N0cmluZyhzdHJpbmcpO1xuXG4gICAgdmFyIHN0clN5bWJvbHMgPSBoYXNVbmljb2RlKHN0cmluZylcbiAgICAgID8gc3RyaW5nVG9BcnJheShzdHJpbmcpXG4gICAgICA6IHVuZGVmaW5lZDtcblxuICAgIHZhciBjaHIgPSBzdHJTeW1ib2xzXG4gICAgICA/IHN0clN5bWJvbHNbMF1cbiAgICAgIDogc3RyaW5nLmNoYXJBdCgwKTtcblxuICAgIHZhciB0cmFpbGluZyA9IHN0clN5bWJvbHNcbiAgICAgID8gY2FzdFNsaWNlKHN0clN5bWJvbHMsIDEpLmpvaW4oJycpXG4gICAgICA6IHN0cmluZy5zbGljZSgxKTtcblxuICAgIHJldHVybiBjaHJbbWV0aG9kTmFtZV0oKSArIHRyYWlsaW5nO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZUNhc2VGaXJzdDtcbiIsInZhciBjcmVhdGVDYXNlRmlyc3QgPSByZXF1aXJlKCcuL19jcmVhdGVDYXNlRmlyc3QnKTtcblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGBzdHJpbmdgIHRvIHVwcGVyIGNhc2UuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHBhcmFtIHtzdHJpbmd9IFtzdHJpbmc9JyddIFRoZSBzdHJpbmcgdG8gY29udmVydC5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIGNvbnZlcnRlZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8udXBwZXJGaXJzdCgnZnJlZCcpO1xuICogLy8gPT4gJ0ZyZWQnXG4gKlxuICogXy51cHBlckZpcnN0KCdGUkVEJyk7XG4gKiAvLyA9PiAnRlJFRCdcbiAqL1xudmFyIHVwcGVyRmlyc3QgPSBjcmVhdGVDYXNlRmlyc3QoJ3RvVXBwZXJDYXNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gdXBwZXJGaXJzdDtcbiIsInZhciB0b1N0cmluZyA9IHJlcXVpcmUoJy4vdG9TdHJpbmcnKSxcbiAgICB1cHBlckZpcnN0ID0gcmVxdWlyZSgnLi91cHBlckZpcnN0Jyk7XG5cbi8qKlxuICogQ29udmVydHMgdGhlIGZpcnN0IGNoYXJhY3RlciBvZiBgc3RyaW5nYCB0byB1cHBlciBjYXNlIGFuZCB0aGUgcmVtYWluaW5nXG4gKiB0byBsb3dlciBjYXNlLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4wLjBcbiAqIEBjYXRlZ29yeSBTdHJpbmdcbiAqIEBwYXJhbSB7c3RyaW5nfSBbc3RyaW5nPScnXSBUaGUgc3RyaW5nIHRvIGNhcGl0YWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBjYXBpdGFsaXplZCBzdHJpbmcuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uY2FwaXRhbGl6ZSgnRlJFRCcpO1xuICogLy8gPT4gJ0ZyZWQnXG4gKi9cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyaW5nKSB7XG4gIHJldHVybiB1cHBlckZpcnN0KHRvU3RyaW5nKHN0cmluZykudG9Mb3dlckNhc2UoKSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY2FwaXRhbGl6ZTtcbiIsInZhciBjYXBpdGFsaXplID0gcmVxdWlyZSgnLi9jYXBpdGFsaXplJyksXG4gICAgY3JlYXRlQ29tcG91bmRlciA9IHJlcXVpcmUoJy4vX2NyZWF0ZUNvbXBvdW5kZXInKTtcblxuLyoqXG4gKiBDb252ZXJ0cyBgc3RyaW5nYCB0byBbY2FtZWwgY2FzZV0oaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ2FtZWxDYXNlKS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDMuMC4wXG4gKiBAY2F0ZWdvcnkgU3RyaW5nXG4gKiBAcGFyYW0ge3N0cmluZ30gW3N0cmluZz0nJ10gVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHJldHVybnMge3N0cmluZ30gUmV0dXJucyB0aGUgY2FtZWwgY2FzZWQgc3RyaW5nLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmNhbWVsQ2FzZSgnRm9vIEJhcicpO1xuICogLy8gPT4gJ2Zvb0JhcidcbiAqXG4gKiBfLmNhbWVsQ2FzZSgnLS1mb28tYmFyLS0nKTtcbiAqIC8vID0+ICdmb29CYXInXG4gKlxuICogXy5jYW1lbENhc2UoJ19fRk9PX0JBUl9fJyk7XG4gKiAvLyA9PiAnZm9vQmFyJ1xuICovXG52YXIgY2FtZWxDYXNlID0gY3JlYXRlQ29tcG91bmRlcihmdW5jdGlvbihyZXN1bHQsIHdvcmQsIGluZGV4KSB7XG4gIHdvcmQgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gIHJldHVybiByZXN1bHQgKyAoaW5kZXggPyBjYXBpdGFsaXplKHdvcmQpIDogd29yZCk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBjYW1lbENhc2U7XG4iLCJ2YXIgYmFzZUFzc2lnblZhbHVlID0gcmVxdWlyZSgnLi9fYmFzZUFzc2lnblZhbHVlJyksXG4gICAgYmFzZUZvck93biA9IHJlcXVpcmUoJy4vX2Jhc2VGb3JPd24nKSxcbiAgICBiYXNlSXRlcmF0ZWUgPSByZXF1aXJlKCcuL19iYXNlSXRlcmF0ZWUnKTtcblxuLyoqXG4gKiBUaGUgb3Bwb3NpdGUgb2YgYF8ubWFwVmFsdWVzYDsgdGhpcyBtZXRob2QgY3JlYXRlcyBhbiBvYmplY3Qgd2l0aCB0aGVcbiAqIHNhbWUgdmFsdWVzIGFzIGBvYmplY3RgIGFuZCBrZXlzIGdlbmVyYXRlZCBieSBydW5uaW5nIGVhY2ggb3duIGVudW1lcmFibGVcbiAqIHN0cmluZyBrZXllZCBwcm9wZXJ0eSBvZiBgb2JqZWN0YCB0aHJ1IGBpdGVyYXRlZWAuIFRoZSBpdGVyYXRlZSBpcyBpbnZva2VkXG4gKiB3aXRoIHRocmVlIGFyZ3VtZW50czogKHZhbHVlLCBrZXksIG9iamVjdCkuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAzLjguMFxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtpdGVyYXRlZT1fLmlkZW50aXR5XSBUaGUgZnVuY3Rpb24gaW52b2tlZCBwZXIgaXRlcmF0aW9uLlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbmV3IG1hcHBlZCBvYmplY3QuXG4gKiBAc2VlIF8ubWFwVmFsdWVzXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8ubWFwS2V5cyh7ICdhJzogMSwgJ2InOiAyIH0sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAqICAgcmV0dXJuIGtleSArIHZhbHVlO1xuICogfSk7XG4gKiAvLyA9PiB7ICdhMSc6IDEsICdiMic6IDIgfVxuICovXG5mdW5jdGlvbiBtYXBLZXlzKG9iamVjdCwgaXRlcmF0ZWUpIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBpdGVyYXRlZSA9IGJhc2VJdGVyYXRlZShpdGVyYXRlZSwgMyk7XG5cbiAgYmFzZUZvck93bihvYmplY3QsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iamVjdCkge1xuICAgIGJhc2VBc3NpZ25WYWx1ZShyZXN1bHQsIGl0ZXJhdGVlKHZhbHVlLCBrZXksIG9iamVjdCksIHZhbHVlKTtcbiAgfSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbWFwS2V5cztcbiIsIlxuLyoqXG4gKiBUb3BvbG9naWNhbCBzb3J0aW5nIGZ1bmN0aW9uXG4gKlxuICogQHBhcmFtIHtBcnJheX0gZWRnZXNcbiAqIEByZXR1cm5zIHtBcnJheX1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVkZ2VzKSB7XG4gIHJldHVybiB0b3Bvc29ydCh1bmlxdWVOb2RlcyhlZGdlcyksIGVkZ2VzKVxufVxuXG5tb2R1bGUuZXhwb3J0cy5hcnJheSA9IHRvcG9zb3J0XG5cbmZ1bmN0aW9uIHRvcG9zb3J0KG5vZGVzLCBlZGdlcykge1xuICB2YXIgY3Vyc29yID0gbm9kZXMubGVuZ3RoXG4gICAgLCBzb3J0ZWQgPSBuZXcgQXJyYXkoY3Vyc29yKVxuICAgICwgdmlzaXRlZCA9IHt9XG4gICAgLCBpID0gY3Vyc29yXG4gICAgLy8gQmV0dGVyIGRhdGEgc3RydWN0dXJlcyBtYWtlIGFsZ29yaXRobSBtdWNoIGZhc3Rlci5cbiAgICAsIG91dGdvaW5nRWRnZXMgPSBtYWtlT3V0Z29pbmdFZGdlcyhlZGdlcylcbiAgICAsIG5vZGVzSGFzaCA9IG1ha2VOb2Rlc0hhc2gobm9kZXMpXG5cbiAgLy8gY2hlY2sgZm9yIHVua25vd24gbm9kZXNcbiAgZWRnZXMuZm9yRWFjaChmdW5jdGlvbihlZGdlKSB7XG4gICAgaWYgKCFub2Rlc0hhc2guaGFzKGVkZ2VbMF0pIHx8ICFub2Rlc0hhc2guaGFzKGVkZ2VbMV0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbm9kZS4gVGhlcmUgaXMgYW4gdW5rbm93biBub2RlIGluIHRoZSBzdXBwbGllZCBlZGdlcy4nKVxuICAgIH1cbiAgfSlcblxuICB3aGlsZSAoaS0tKSB7XG4gICAgaWYgKCF2aXNpdGVkW2ldKSB2aXNpdChub2Rlc1tpXSwgaSwgbmV3IFNldCgpKVxuICB9XG5cbiAgcmV0dXJuIHNvcnRlZFxuXG4gIGZ1bmN0aW9uIHZpc2l0KG5vZGUsIGksIHByZWRlY2Vzc29ycykge1xuICAgIGlmKHByZWRlY2Vzc29ycy5oYXMobm9kZSkpIHtcbiAgICAgIHZhciBub2RlUmVwXG4gICAgICB0cnkge1xuICAgICAgICBub2RlUmVwID0gXCIsIG5vZGUgd2FzOlwiICsgSlNPTi5zdHJpbmdpZnkobm9kZSlcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBub2RlUmVwID0gXCJcIlxuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDeWNsaWMgZGVwZW5kZW5jeScgKyBub2RlUmVwKVxuICAgIH1cblxuICAgIGlmICghbm9kZXNIYXNoLmhhcyhub2RlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGb3VuZCB1bmtub3duIG5vZGUuIE1ha2Ugc3VyZSB0byBwcm92aWRlZCBhbGwgaW52b2x2ZWQgbm9kZXMuIFVua25vd24gbm9kZTogJytKU09OLnN0cmluZ2lmeShub2RlKSlcbiAgICB9XG5cbiAgICBpZiAodmlzaXRlZFtpXSkgcmV0dXJuO1xuICAgIHZpc2l0ZWRbaV0gPSB0cnVlXG5cbiAgICB2YXIgb3V0Z29pbmcgPSBvdXRnb2luZ0VkZ2VzLmdldChub2RlKSB8fCBuZXcgU2V0KClcbiAgICBvdXRnb2luZyA9IEFycmF5LmZyb20ob3V0Z29pbmcpXG5cbiAgICBpZiAoaSA9IG91dGdvaW5nLmxlbmd0aCkge1xuICAgICAgcHJlZGVjZXNzb3JzLmFkZChub2RlKVxuICAgICAgZG8ge1xuICAgICAgICB2YXIgY2hpbGQgPSBvdXRnb2luZ1stLWldXG4gICAgICAgIHZpc2l0KGNoaWxkLCBub2Rlc0hhc2guZ2V0KGNoaWxkKSwgcHJlZGVjZXNzb3JzKVxuICAgICAgfSB3aGlsZSAoaSlcbiAgICAgIHByZWRlY2Vzc29ycy5kZWxldGUobm9kZSlcbiAgICB9XG5cbiAgICBzb3J0ZWRbLS1jdXJzb3JdID0gbm9kZVxuICB9XG59XG5cbmZ1bmN0aW9uIHVuaXF1ZU5vZGVzKGFycil7XG4gIHZhciByZXMgPSBuZXcgU2V0KClcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIHZhciBlZGdlID0gYXJyW2ldXG4gICAgcmVzLmFkZChlZGdlWzBdKVxuICAgIHJlcy5hZGQoZWRnZVsxXSlcbiAgfVxuICByZXR1cm4gQXJyYXkuZnJvbShyZXMpXG59XG5cbmZ1bmN0aW9uIG1ha2VPdXRnb2luZ0VkZ2VzKGFycil7XG4gIHZhciBlZGdlcyA9IG5ldyBNYXAoKVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdmFyIGVkZ2UgPSBhcnJbaV1cbiAgICBpZiAoIWVkZ2VzLmhhcyhlZGdlWzBdKSkgZWRnZXMuc2V0KGVkZ2VbMF0sIG5ldyBTZXQoKSlcbiAgICBpZiAoIWVkZ2VzLmhhcyhlZGdlWzFdKSkgZWRnZXMuc2V0KGVkZ2VbMV0sIG5ldyBTZXQoKSlcbiAgICBlZGdlcy5nZXQoZWRnZVswXSkuYWRkKGVkZ2VbMV0pXG4gIH1cbiAgcmV0dXJuIGVkZ2VzXG59XG5cbmZ1bmN0aW9uIG1ha2VOb2Rlc0hhc2goYXJyKXtcbiAgdmFyIHJlcyA9IG5ldyBNYXAoKVxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcmVzLnNldChhcnJbaV0sIGkpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuIiwiaW1wb3J0IGhhcyBmcm9tICdsb2Rhc2gvaGFzJzsgLy8gQHRzLWV4cGVjdC1lcnJvclxuXG5pbXBvcnQgdG9wb3NvcnQgZnJvbSAndG9wb3NvcnQnO1xuaW1wb3J0IHsgc3BsaXQgfSBmcm9tICdwcm9wZXJ0eS1leHByJztcbmltcG9ydCBSZWYgZnJvbSAnLi4vUmVmZXJlbmNlJztcbmltcG9ydCBpc1NjaGVtYSBmcm9tICcuL2lzU2NoZW1hJztcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNvcnRGaWVsZHMoZmllbGRzLCBleGNsdWRlcyA9IFtdKSB7XG4gIGxldCBlZGdlcyA9IFtdO1xuICBsZXQgbm9kZXMgPSBbXTtcblxuICBmdW5jdGlvbiBhZGROb2RlKGRlcFBhdGgsIGtleSkge1xuICAgIHZhciBub2RlID0gc3BsaXQoZGVwUGF0aClbMF07XG4gICAgaWYgKCF+bm9kZXMuaW5kZXhPZihub2RlKSkgbm9kZXMucHVzaChub2RlKTtcbiAgICBpZiAoIX5leGNsdWRlcy5pbmRleE9mKGAke2tleX0tJHtub2RlfWApKSBlZGdlcy5wdXNoKFtrZXksIG5vZGVdKTtcbiAgfVxuXG4gIGZvciAoY29uc3Qga2V5IGluIGZpZWxkcykgaWYgKGhhcyhmaWVsZHMsIGtleSkpIHtcbiAgICBsZXQgdmFsdWUgPSBmaWVsZHNba2V5XTtcbiAgICBpZiAoIX5ub2Rlcy5pbmRleE9mKGtleSkpIG5vZGVzLnB1c2goa2V5KTtcbiAgICBpZiAoUmVmLmlzUmVmKHZhbHVlKSAmJiB2YWx1ZS5pc1NpYmxpbmcpIGFkZE5vZGUodmFsdWUucGF0aCwga2V5KTtlbHNlIGlmIChpc1NjaGVtYSh2YWx1ZSkgJiYgJ2RlcHMnIGluIHZhbHVlKSB2YWx1ZS5kZXBzLmZvckVhY2gocGF0aCA9PiBhZGROb2RlKHBhdGgsIGtleSkpO1xuICB9XG5cbiAgcmV0dXJuIHRvcG9zb3J0LmFycmF5KG5vZGVzLCBlZGdlcykucmV2ZXJzZSgpO1xufSIsImZ1bmN0aW9uIGZpbmRJbmRleChhcnIsIGVycikge1xuICBsZXQgaWR4ID0gSW5maW5pdHk7XG4gIGFyci5zb21lKChrZXksIGlpKSA9PiB7XG4gICAgdmFyIF9lcnIkcGF0aDtcblxuICAgIGlmICgoKF9lcnIkcGF0aCA9IGVyci5wYXRoKSA9PSBudWxsID8gdm9pZCAwIDogX2VyciRwYXRoLmluZGV4T2Yoa2V5KSkgIT09IC0xKSB7XG4gICAgICBpZHggPSBpaTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBpZHg7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNvcnRCeUtleU9yZGVyKGtleXMpIHtcbiAgcmV0dXJuIChhLCBiKSA9PiB7XG4gICAgcmV0dXJuIGZpbmRJbmRleChrZXlzLCBhKSAtIGZpbmRJbmRleChrZXlzLCBiKTtcbiAgfTtcbn0iLCJmdW5jdGlvbiBfZXh0ZW5kcygpIHsgX2V4dGVuZHMgPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uICh0YXJnZXQpIHsgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHsgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpXTsgZm9yICh2YXIga2V5IGluIHNvdXJjZSkgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNvdXJjZSwga2V5KSkgeyB0YXJnZXRba2V5XSA9IHNvdXJjZVtrZXldOyB9IH0gfSByZXR1cm4gdGFyZ2V0OyB9OyByZXR1cm4gX2V4dGVuZHMuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxuXG5pbXBvcnQgaGFzIGZyb20gJ2xvZGFzaC9oYXMnO1xuaW1wb3J0IHNuYWtlQ2FzZSBmcm9tICdsb2Rhc2gvc25ha2VDYXNlJztcbmltcG9ydCBjYW1lbENhc2UgZnJvbSAnbG9kYXNoL2NhbWVsQ2FzZSc7XG5pbXBvcnQgbWFwS2V5cyBmcm9tICdsb2Rhc2gvbWFwS2V5cyc7XG5pbXBvcnQgbWFwVmFsdWVzIGZyb20gJ2xvZGFzaC9tYXBWYWx1ZXMnO1xuaW1wb3J0IHsgZ2V0dGVyIH0gZnJvbSAncHJvcGVydHktZXhwcic7XG5pbXBvcnQgeyBvYmplY3QgYXMgbG9jYWxlIH0gZnJvbSAnLi9sb2NhbGUnO1xuaW1wb3J0IHNvcnRGaWVsZHMgZnJvbSAnLi91dGlsL3NvcnRGaWVsZHMnO1xuaW1wb3J0IHNvcnRCeUtleU9yZGVyIGZyb20gJy4vdXRpbC9zb3J0QnlLZXlPcmRlcic7XG5pbXBvcnQgcnVuVGVzdHMgZnJvbSAnLi91dGlsL3J1blRlc3RzJztcbmltcG9ydCBWYWxpZGF0aW9uRXJyb3IgZnJvbSAnLi9WYWxpZGF0aW9uRXJyb3InO1xuaW1wb3J0IEJhc2VTY2hlbWEgZnJvbSAnLi9zY2hlbWEnO1xuXG5sZXQgaXNPYmplY3QgPSBvYmogPT4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xuXG5mdW5jdGlvbiB1bmtub3duKGN0eCwgdmFsdWUpIHtcbiAgbGV0IGtub3duID0gT2JqZWN0LmtleXMoY3R4LmZpZWxkcyk7XG4gIHJldHVybiBPYmplY3Qua2V5cyh2YWx1ZSkuZmlsdGVyKGtleSA9PiBrbm93bi5pbmRleE9mKGtleSkgPT09IC0xKTtcbn1cblxuY29uc3QgZGVmYXVsdFNvcnQgPSBzb3J0QnlLZXlPcmRlcihbXSk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYmplY3RTY2hlbWEgZXh0ZW5kcyBCYXNlU2NoZW1hIHtcbiAgY29uc3RydWN0b3Ioc3BlYykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdvYmplY3QnXG4gICAgfSk7XG4gICAgdGhpcy5maWVsZHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuX3NvcnRFcnJvcnMgPSBkZWZhdWx0U29ydDtcbiAgICB0aGlzLl9ub2RlcyA9IFtdO1xuICAgIHRoaXMuX2V4Y2x1ZGVkRWRnZXMgPSBbXTtcbiAgICB0aGlzLndpdGhNdXRhdGlvbigoKSA9PiB7XG4gICAgICB0aGlzLnRyYW5zZm9ybShmdW5jdGlvbiBjb2VyY2UodmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFsdWUgPSBKU09OLnBhcnNlKHZhbHVlKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1R5cGUodmFsdWUpKSByZXR1cm4gdmFsdWU7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChzcGVjKSB7XG4gICAgICAgIHRoaXMuc2hhcGUoc3BlYyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBfdHlwZUNoZWNrKHZhbHVlKSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KHZhbHVlKSB8fCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG4gIH1cblxuICBfY2FzdChfdmFsdWUsIG9wdGlvbnMgPSB7fSkge1xuICAgIHZhciBfb3B0aW9ucyRzdHJpcFVua25vd247XG5cbiAgICBsZXQgdmFsdWUgPSBzdXBlci5fY2FzdChfdmFsdWUsIG9wdGlvbnMpOyAvL3Nob3VsZCBpZ25vcmUgbnVsbHMgaGVyZVxuXG5cbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMuZ2V0RGVmYXVsdCgpO1xuICAgIGlmICghdGhpcy5fdHlwZUNoZWNrKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuICAgIGxldCBmaWVsZHMgPSB0aGlzLmZpZWxkcztcbiAgICBsZXQgc3RyaXAgPSAoX29wdGlvbnMkc3RyaXBVbmtub3duID0gb3B0aW9ucy5zdHJpcFVua25vd24pICE9IG51bGwgPyBfb3B0aW9ucyRzdHJpcFVua25vd24gOiB0aGlzLnNwZWMubm9Vbmtub3duO1xuXG4gICAgbGV0IHByb3BzID0gdGhpcy5fbm9kZXMuY29uY2F0KE9iamVjdC5rZXlzKHZhbHVlKS5maWx0ZXIodiA9PiB0aGlzLl9ub2Rlcy5pbmRleE9mKHYpID09PSAtMSkpO1xuXG4gICAgbGV0IGludGVybWVkaWF0ZVZhbHVlID0ge307IC8vIGlzIGZpbGxlZCBkdXJpbmcgdGhlIHRyYW5zZm9ybSBiZWxvd1xuXG4gICAgbGV0IGlubmVyT3B0aW9ucyA9IF9leHRlbmRzKHt9LCBvcHRpb25zLCB7XG4gICAgICBwYXJlbnQ6IGludGVybWVkaWF0ZVZhbHVlLFxuICAgICAgX192YWxpZGF0aW5nOiBvcHRpb25zLl9fdmFsaWRhdGluZyB8fCBmYWxzZVxuICAgIH0pO1xuXG4gICAgbGV0IGlzQ2hhbmdlZCA9IGZhbHNlO1xuXG4gICAgZm9yIChjb25zdCBwcm9wIG9mIHByb3BzKSB7XG4gICAgICBsZXQgZmllbGQgPSBmaWVsZHNbcHJvcF07XG4gICAgICBsZXQgZXhpc3RzID0gaGFzKHZhbHVlLCBwcm9wKTtcblxuICAgICAgaWYgKGZpZWxkKSB7XG4gICAgICAgIGxldCBmaWVsZFZhbHVlO1xuICAgICAgICBsZXQgaW5wdXRWYWx1ZSA9IHZhbHVlW3Byb3BdOyAvLyBzYWZlIHRvIG11dGF0ZSBzaW5jZSB0aGlzIGlzIGZpcmVkIGluIHNlcXVlbmNlXG5cbiAgICAgICAgaW5uZXJPcHRpb25zLnBhdGggPSAob3B0aW9ucy5wYXRoID8gYCR7b3B0aW9ucy5wYXRofS5gIDogJycpICsgcHJvcDsgLy8gaW5uZXJPcHRpb25zLnZhbHVlID0gdmFsdWVbcHJvcF07XG5cbiAgICAgICAgZmllbGQgPSBmaWVsZC5yZXNvbHZlKHtcbiAgICAgICAgICB2YWx1ZTogaW5wdXRWYWx1ZSxcbiAgICAgICAgICBjb250ZXh0OiBvcHRpb25zLmNvbnRleHQsXG4gICAgICAgICAgcGFyZW50OiBpbnRlcm1lZGlhdGVWYWx1ZVxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IGZpZWxkU3BlYyA9ICdzcGVjJyBpbiBmaWVsZCA/IGZpZWxkLnNwZWMgOiB1bmRlZmluZWQ7XG4gICAgICAgIGxldCBzdHJpY3QgPSBmaWVsZFNwZWMgPT0gbnVsbCA/IHZvaWQgMCA6IGZpZWxkU3BlYy5zdHJpY3Q7XG5cbiAgICAgICAgaWYgKGZpZWxkU3BlYyA9PSBudWxsID8gdm9pZCAwIDogZmllbGRTcGVjLnN0cmlwKSB7XG4gICAgICAgICAgaXNDaGFuZ2VkID0gaXNDaGFuZ2VkIHx8IHByb3AgaW4gdmFsdWU7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBmaWVsZFZhbHVlID0gIW9wdGlvbnMuX192YWxpZGF0aW5nIHx8ICFzdHJpY3QgPyAvLyBUT0RPOiB1c2UgX2Nhc3QsIHRoaXMgaXMgZG91YmxlIHJlc29sdmluZ1xuICAgICAgICBmaWVsZC5jYXN0KHZhbHVlW3Byb3BdLCBpbm5lck9wdGlvbnMpIDogdmFsdWVbcHJvcF07XG5cbiAgICAgICAgaWYgKGZpZWxkVmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGludGVybWVkaWF0ZVZhbHVlW3Byb3BdID0gZmllbGRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChleGlzdHMgJiYgIXN0cmlwKSB7XG4gICAgICAgIGludGVybWVkaWF0ZVZhbHVlW3Byb3BdID0gdmFsdWVbcHJvcF07XG4gICAgICB9XG5cbiAgICAgIGlmIChpbnRlcm1lZGlhdGVWYWx1ZVtwcm9wXSAhPT0gdmFsdWVbcHJvcF0pIHtcbiAgICAgICAgaXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaXNDaGFuZ2VkID8gaW50ZXJtZWRpYXRlVmFsdWUgOiB2YWx1ZTtcbiAgfVxuXG4gIF92YWxpZGF0ZShfdmFsdWUsIG9wdHMgPSB7fSwgY2FsbGJhY2spIHtcbiAgICBsZXQgZXJyb3JzID0gW107XG4gICAgbGV0IHtcbiAgICAgIHN5bmMsXG4gICAgICBmcm9tID0gW10sXG4gICAgICBvcmlnaW5hbFZhbHVlID0gX3ZhbHVlLFxuICAgICAgYWJvcnRFYXJseSA9IHRoaXMuc3BlYy5hYm9ydEVhcmx5LFxuICAgICAgcmVjdXJzaXZlID0gdGhpcy5zcGVjLnJlY3Vyc2l2ZVxuICAgIH0gPSBvcHRzO1xuICAgIGZyb20gPSBbe1xuICAgICAgc2NoZW1hOiB0aGlzLFxuICAgICAgdmFsdWU6IG9yaWdpbmFsVmFsdWVcbiAgICB9LCAuLi5mcm9tXTsgLy8gdGhpcyBmbGFnIGlzIG5lZWRlZCBmb3IgaGFuZGxpbmcgYHN0cmljdGAgY29ycmVjdGx5IGluIHRoZSBjb250ZXh0IG9mXG4gICAgLy8gdmFsaWRhdGlvbiB2cyBqdXN0IGNhc3RpbmcuIGUuZyBzdHJpY3QoKSBvbiBhIGZpZWxkIGlzIG9ubHkgdXNlZCB3aGVuIHZhbGlkYXRpbmdcblxuICAgIG9wdHMuX192YWxpZGF0aW5nID0gdHJ1ZTtcbiAgICBvcHRzLm9yaWdpbmFsVmFsdWUgPSBvcmlnaW5hbFZhbHVlO1xuICAgIG9wdHMuZnJvbSA9IGZyb207XG5cbiAgICBzdXBlci5fdmFsaWRhdGUoX3ZhbHVlLCBvcHRzLCAoZXJyLCB2YWx1ZSkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICBpZiAoIVZhbGlkYXRpb25FcnJvci5pc0Vycm9yKGVycikgfHwgYWJvcnRFYXJseSkge1xuICAgICAgICAgIHJldHVybiB2b2lkIGNhbGxiYWNrKGVyciwgdmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXJyb3JzLnB1c2goZXJyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFyZWN1cnNpdmUgfHwgIWlzT2JqZWN0KHZhbHVlKSkge1xuICAgICAgICBjYWxsYmFjayhlcnJvcnNbMF0gfHwgbnVsbCwgdmFsdWUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIG9yaWdpbmFsVmFsdWUgPSBvcmlnaW5hbFZhbHVlIHx8IHZhbHVlO1xuXG4gICAgICBsZXQgdGVzdHMgPSB0aGlzLl9ub2Rlcy5tYXAoa2V5ID0+IChfLCBjYikgPT4ge1xuICAgICAgICBsZXQgcGF0aCA9IGtleS5pbmRleE9mKCcuJykgPT09IC0xID8gKG9wdHMucGF0aCA/IGAke29wdHMucGF0aH0uYCA6ICcnKSArIGtleSA6IGAke29wdHMucGF0aCB8fCAnJ31bXCIke2tleX1cIl1gO1xuICAgICAgICBsZXQgZmllbGQgPSB0aGlzLmZpZWxkc1trZXldO1xuXG4gICAgICAgIGlmIChmaWVsZCAmJiAndmFsaWRhdGUnIGluIGZpZWxkKSB7XG4gICAgICAgICAgZmllbGQudmFsaWRhdGUodmFsdWVba2V5XSwgX2V4dGVuZHMoe30sIG9wdHMsIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICBmcm9tLFxuICAgICAgICAgICAgLy8gaW5uZXIgZmllbGRzIGFyZSBhbHdheXMgc3RyaWN0OlxuICAgICAgICAgICAgLy8gMS4gdGhpcyBpc24ndCBzdHJpY3Qgc28gdGhlIGNhc3Rpbmcgd2lsbCBhbHNvIGhhdmUgY2FzdCBpbm5lciB2YWx1ZXNcbiAgICAgICAgICAgIC8vIDIuIHRoaXMgaXMgc3RyaWN0IGluIHdoaWNoIGNhc2UgdGhlIG5lc3RlZCB2YWx1ZXMgd2VyZW4ndCBjYXN0IGVpdGhlclxuICAgICAgICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgICAgICAgcGFyZW50OiB2YWx1ZSxcbiAgICAgICAgICAgIG9yaWdpbmFsVmFsdWU6IG9yaWdpbmFsVmFsdWVba2V5XVxuICAgICAgICAgIH0pLCBjYik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY2IobnVsbCk7XG4gICAgICB9KTtcblxuICAgICAgcnVuVGVzdHMoe1xuICAgICAgICBzeW5jLFxuICAgICAgICB0ZXN0cyxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIGVycm9ycyxcbiAgICAgICAgZW5kRWFybHk6IGFib3J0RWFybHksXG4gICAgICAgIHNvcnQ6IHRoaXMuX3NvcnRFcnJvcnMsXG4gICAgICAgIHBhdGg6IG9wdHMucGF0aFxuICAgICAgfSwgY2FsbGJhY2spO1xuICAgIH0pO1xuICB9XG5cbiAgY2xvbmUoc3BlYykge1xuICAgIGNvbnN0IG5leHQgPSBzdXBlci5jbG9uZShzcGVjKTtcbiAgICBuZXh0LmZpZWxkcyA9IF9leHRlbmRzKHt9LCB0aGlzLmZpZWxkcyk7XG4gICAgbmV4dC5fbm9kZXMgPSB0aGlzLl9ub2RlcztcbiAgICBuZXh0Ll9leGNsdWRlZEVkZ2VzID0gdGhpcy5fZXhjbHVkZWRFZGdlcztcbiAgICBuZXh0Ll9zb3J0RXJyb3JzID0gdGhpcy5fc29ydEVycm9ycztcbiAgICByZXR1cm4gbmV4dDtcbiAgfVxuXG4gIGNvbmNhdChzY2hlbWEpIHtcbiAgICBsZXQgbmV4dCA9IHN1cGVyLmNvbmNhdChzY2hlbWEpO1xuICAgIGxldCBuZXh0RmllbGRzID0gbmV4dC5maWVsZHM7XG5cbiAgICBmb3IgKGxldCBbZmllbGQsIHNjaGVtYU9yUmVmXSBvZiBPYmplY3QuZW50cmllcyh0aGlzLmZpZWxkcykpIHtcbiAgICAgIGNvbnN0IHRhcmdldCA9IG5leHRGaWVsZHNbZmllbGRdO1xuXG4gICAgICBpZiAodGFyZ2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbmV4dEZpZWxkc1tmaWVsZF0gPSBzY2hlbWFPclJlZjtcbiAgICAgIH0gZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgQmFzZVNjaGVtYSAmJiBzY2hlbWFPclJlZiBpbnN0YW5jZW9mIEJhc2VTY2hlbWEpIHtcbiAgICAgICAgbmV4dEZpZWxkc1tmaWVsZF0gPSBzY2hlbWFPclJlZi5jb25jYXQodGFyZ2V0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV4dC53aXRoTXV0YXRpb24oKCkgPT4gbmV4dC5zaGFwZShuZXh0RmllbGRzKSk7XG4gIH1cblxuICBnZXREZWZhdWx0RnJvbVNoYXBlKCkge1xuICAgIGxldCBkZnQgPSB7fTtcblxuICAgIHRoaXMuX25vZGVzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gdGhpcy5maWVsZHNba2V5XTtcbiAgICAgIGRmdFtrZXldID0gJ2RlZmF1bHQnIGluIGZpZWxkID8gZmllbGQuZ2V0RGVmYXVsdCgpIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRmdDtcbiAgfVxuXG4gIF9nZXREZWZhdWx0KCkge1xuICAgIGlmICgnZGVmYXVsdCcgaW4gdGhpcy5zcGVjKSB7XG4gICAgICByZXR1cm4gc3VwZXIuX2dldERlZmF1bHQoKTtcbiAgICB9IC8vIGlmIHRoZXJlIGlzIG5vIGRlZmF1bHQgc2V0IGludmVudCBvbmVcblxuXG4gICAgaWYgKCF0aGlzLl9ub2Rlcy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RGVmYXVsdEZyb21TaGFwZSgpO1xuICB9XG5cbiAgc2hhcGUoYWRkaXRpb25zLCBleGNsdWRlcyA9IFtdKSB7XG4gICAgbGV0IG5leHQgPSB0aGlzLmNsb25lKCk7XG4gICAgbGV0IGZpZWxkcyA9IE9iamVjdC5hc3NpZ24obmV4dC5maWVsZHMsIGFkZGl0aW9ucyk7XG4gICAgbmV4dC5maWVsZHMgPSBmaWVsZHM7XG4gICAgbmV4dC5fc29ydEVycm9ycyA9IHNvcnRCeUtleU9yZGVyKE9iamVjdC5rZXlzKGZpZWxkcykpO1xuXG4gICAgaWYgKGV4Y2x1ZGVzLmxlbmd0aCkge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGV4Y2x1ZGVzWzBdKSkgZXhjbHVkZXMgPSBbZXhjbHVkZXNdO1xuICAgICAgbGV0IGtleXMgPSBleGNsdWRlcy5tYXAoKFtmaXJzdCwgc2Vjb25kXSkgPT4gYCR7Zmlyc3R9LSR7c2Vjb25kfWApO1xuICAgICAgbmV4dC5fZXhjbHVkZWRFZGdlcyA9IG5leHQuX2V4Y2x1ZGVkRWRnZXMuY29uY2F0KGtleXMpO1xuICAgIH1cblxuICAgIG5leHQuX25vZGVzID0gc29ydEZpZWxkcyhmaWVsZHMsIG5leHQuX2V4Y2x1ZGVkRWRnZXMpO1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgcGljayhrZXlzKSB7XG4gICAgY29uc3QgcGlja2VkID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICBpZiAodGhpcy5maWVsZHNba2V5XSkgcGlja2VkW2tleV0gPSB0aGlzLmZpZWxkc1trZXldO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmNsb25lKCkud2l0aE11dGF0aW9uKG5leHQgPT4ge1xuICAgICAgbmV4dC5maWVsZHMgPSB7fTtcbiAgICAgIHJldHVybiBuZXh0LnNoYXBlKHBpY2tlZCk7XG4gICAgfSk7XG4gIH1cblxuICBvbWl0KGtleXMpIHtcbiAgICBjb25zdCBuZXh0ID0gdGhpcy5jbG9uZSgpO1xuICAgIGNvbnN0IGZpZWxkcyA9IG5leHQuZmllbGRzO1xuICAgIG5leHQuZmllbGRzID0ge307XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICBkZWxldGUgZmllbGRzW2tleV07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHQud2l0aE11dGF0aW9uKCgpID0+IG5leHQuc2hhcGUoZmllbGRzKSk7XG4gIH1cblxuICBmcm9tKGZyb20sIHRvLCBhbGlhcykge1xuICAgIGxldCBmcm9tR2V0dGVyID0gZ2V0dGVyKGZyb20sIHRydWUpO1xuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybShvYmogPT4ge1xuICAgICAgaWYgKG9iaiA9PSBudWxsKSByZXR1cm4gb2JqO1xuICAgICAgbGV0IG5ld09iaiA9IG9iajtcblxuICAgICAgaWYgKGhhcyhvYmosIGZyb20pKSB7XG4gICAgICAgIG5ld09iaiA9IF9leHRlbmRzKHt9LCBvYmopO1xuICAgICAgICBpZiAoIWFsaWFzKSBkZWxldGUgbmV3T2JqW2Zyb21dO1xuICAgICAgICBuZXdPYmpbdG9dID0gZnJvbUdldHRlcihvYmopO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3T2JqO1xuICAgIH0pO1xuICB9XG5cbiAgbm9Vbmtub3duKG5vQWxsb3cgPSB0cnVlLCBtZXNzYWdlID0gbG9jYWxlLm5vVW5rbm93bikge1xuICAgIGlmICh0eXBlb2Ygbm9BbGxvdyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIG1lc3NhZ2UgPSBub0FsbG93O1xuICAgICAgbm9BbGxvdyA9IHRydWU7XG4gICAgfVxuXG4gICAgbGV0IG5leHQgPSB0aGlzLnRlc3Qoe1xuICAgICAgbmFtZTogJ25vVW5rbm93bicsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuXG4gICAgICB0ZXN0KHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgY29uc3QgdW5rbm93bktleXMgPSB1bmtub3duKHRoaXMuc2NoZW1hLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiAhbm9BbGxvdyB8fCB1bmtub3duS2V5cy5sZW5ndGggPT09IDAgfHwgdGhpcy5jcmVhdGVFcnJvcih7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICB1bmtub3duOiB1bmtub3duS2V5cy5qb2luKCcsICcpXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIG5leHQuc3BlYy5ub1Vua25vd24gPSBub0FsbG93O1xuICAgIHJldHVybiBuZXh0O1xuICB9XG5cbiAgdW5rbm93bihhbGxvdyA9IHRydWUsIG1lc3NhZ2UgPSBsb2NhbGUubm9Vbmtub3duKSB7XG4gICAgcmV0dXJuIHRoaXMubm9Vbmtub3duKCFhbGxvdywgbWVzc2FnZSk7XG4gIH1cblxuICB0cmFuc2Zvcm1LZXlzKGZuKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKG9iaiA9PiBvYmogJiYgbWFwS2V5cyhvYmosIChfLCBrZXkpID0+IGZuKGtleSkpKTtcbiAgfVxuXG4gIGNhbWVsQ2FzZSgpIHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm1LZXlzKGNhbWVsQ2FzZSk7XG4gIH1cblxuICBzbmFrZUNhc2UoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtS2V5cyhzbmFrZUNhc2UpO1xuICB9XG5cbiAgY29uc3RhbnRDYXNlKCkge1xuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybUtleXMoa2V5ID0+IHNuYWtlQ2FzZShrZXkpLnRvVXBwZXJDYXNlKCkpO1xuICB9XG5cbiAgZGVzY3JpYmUoKSB7XG4gICAgbGV0IGJhc2UgPSBzdXBlci5kZXNjcmliZSgpO1xuICAgIGJhc2UuZmllbGRzID0gbWFwVmFsdWVzKHRoaXMuZmllbGRzLCB2YWx1ZSA9PiB2YWx1ZS5kZXNjcmliZSgpKTtcbiAgICByZXR1cm4gYmFzZTtcbiAgfVxuXG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKHNwZWMpIHtcbiAgcmV0dXJuIG5ldyBPYmplY3RTY2hlbWEoc3BlYyk7XG59XG5jcmVhdGUucHJvdG90eXBlID0gT2JqZWN0U2NoZW1hLnByb3RvdHlwZTsiLCIvKiBnbG9iYWwgJCAqL1xuXG4vLyBkaXNhYmxlIGJ1dHRvbiBpZiB0aGVyZSBhcmUgYW55IGVycm9ycyAtIG9yIHN1Ym1pdHRpbmcgaXMgdHJ1ZS4uLi5cbi8qKiBnaXZlbiBhbiBhcnJheSBvZiB0d28gZWxlbWVudCBhcnJheXMsIHJldHVybiBhbiBvYmplY3Qga2V5ZWQgYnlcbiAqIHRoZSB1bmlxdWUgdmFsdWVzIGluIHRoZSBmaXJzdCBlbGVtZW50LiAgdGhlIGVudHJpZXMgb2YgdGhlIG9iamVjdHNcbiAqIHdpbGwgYmUgYW4gYXJyYXkgb2YgdGhlIHNlY29uZCBvYmplY3QuICBVc2VkIHRvIG1ha2UgZHluYW1pYyBzZWxlY3RcbiAqIHdpZGdldHMgLSBjaG9pY2UgY2FuIGNoYW5nZSBkZXBlbmRpbmcgb24gdGhlIHZhbHVlIG9mIHRoZSBrZXlcbiAqIChlLmcuIHN0cmFpbnMgZGVwZW5kIG9uIHNwZWNpZXMpICovXG5leHBvcnQgY29uc3QgbWFrZV9jaG9pY2VzID0gKHZhbHVlcykgPT4ge1xuICBjb25zdCBjaG9pY2VzID0gdmFsdWVzLnJlZHVjZSgoYWNjLCB4KSA9PiB7XG4gICAgbGV0IFtrZXksIHZhbF0gPSB4O1xuICAgIGlmICghYWNjLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGFjY1trZXldID0gW107XG4gICAgfVxuICAgIGFjY1trZXldID0gWy4uLmFjY1trZXldLCB2YWxdO1xuICAgIC8vYWNjW2tleV0ucHVzaCh2YWwpO1xuICAgIHJldHVybiBhY2M7XG4gIH0sIHt9KTtcbiAgcmV0dXJuIGNob2ljZXM7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q2hvaWNlcyh1cmwsIHN1Y2Nlc3MsIGVycm1zZykge1xuICBhd2FpdCAkLmFqYXgoe1xuICAgIHVybDogdXJsLFxuICAgIGRhdGFUeXBlOiBcImpzb25cIixcbiAgICBzdWNjZXNzOiBzdWNjZXNzLFxuICAgIGVycm9yOiAoKSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhlcnJtc2cpO1xuICAgIH0sXG4gIH0pO1xufVxuXG4vKiogIFZlcmlmeSB0aGF0IHRoZSBzZWxlY3RlZCBvcHRpb24gaGFzIGEgdmFsdWUsIGZsYWcgdGhlIHNlbGVjdFxuICogICBib3ggaWYgaXQgZG9lc24ndCBhbmQgYWRkIGEgbWVhbmluZ2Z1bCBtZXNzYWdlXG4gKiAgIGVnIC0gJ1NlbmVjYScgaXMgbm90IGEgdmFsaWQgY2hvaWNlIGZvciBDaGlub29rIFNhbG1vbiAqL1xuZXhwb3J0IGNvbnN0IGNoZWNrTXlDaG9pY2UgPSAobXlJZCwgcGFyZW50SWQpID0+IHtcbiAgLy9jb25zdCBlbCA9ICQoYCMke215SWR9YCk7XG4gIGNvbnN0IHNlbGVjdGVkX3ZhbCA9ICQoYCMke215SWR9IG9wdGlvbjpzZWxlY3RlZGApLnZhbCgpO1xuICBjb25zdCBzZWxlY3RlZF90ZXh0ID0gJChgIyR7bXlJZH0gb3B0aW9uOnNlbGVjdGVkYCkudGV4dCgpO1xuICBjb25zdCBwYXJlbnRfdGV4dCA9ICQoYCMke3BhcmVudElkfSBvcHRpb246c2VsZWN0ZWRgKS50ZXh0KCk7XG5cbiAgaWYgKHNlbGVjdGVkX3ZhbCA9PT0gXCItOTk5XCIpIHtcbiAgICBjb25zdCBtc2cgPSBgJyR7c2VsZWN0ZWRfdGV4dH0nIGlzIG5vdCBhIHZhbGlkIGNob2ljZSBmb3IgJyR7cGFyZW50X3RleHR9J2A7XG4gICAgLy9zZXRJbnZhbGlkKGVsLCBtc2cpO1xuICAgIGFkZEVycm9yKG15SWQsIFwiaW52YWxpZC1jaG9pY2VcIiwgbXNnKTtcbiAgfSBlbHNlIHtcbiAgICAvL3NldFZhbGlkKGVsKTtcbiAgICByZW1vdmVFcnJvcihteUlkLCBcImludmFsaWQtY2hvaWNlXCIpO1xuICB9XG59O1xuXG5leHBvcnQgY29uc3QgdXBkYXRlX3NlbGVjdG9yID0gKHNlbGVjdG9ySUQsIHBhcmVudElELCBuZXdPcHRpb25zKSA9PiB7XG4gIGNvbnN0IGVsID0gJChgIyR7c2VsZWN0b3JJRH1gKTtcblxuICAvL2NvbnN0IHByZXZpb3VzX3ZhbCA9ICQoYCMke3NlbGVjdG9ySUR9IG9wdGlvbjpzZWxlY3RlZGApLnZhbCgpO1xuICBjb25zdCBwcmV2aW91c190ZXh0ID0gJChgIyR7c2VsZWN0b3JJRH0gb3B0aW9uOnNlbGVjdGVkYCkudGV4dCgpO1xuICBjb25zdCBwYXJlbnRfdGV4dCA9ICQoYCMke3BhcmVudElEfSBvcHRpb246c2VsZWN0ZWRgKS50ZXh0KCk7XG5cbiAgZWwuZW1wdHkoKTsgLy8gcmVtb3ZlIG9sZCBvcHRpb25zXG5cbiAgaWYgKCFPYmplY3QudmFsdWVzKG5ld09wdGlvbnMpLmluY2x1ZGVzKHByZXZpb3VzX3RleHQpKSB7XG4gICAgZWwuYXBwZW5kKCQoXCI8b3B0aW9uPjwvb3B0aW9uPlwiKS5hdHRyKFwidmFsdWVcIiwgXCItOTk5XCIpLnRleHQocHJldmlvdXNfdGV4dCkpO1xuXG4gICAgY29uc3QgbXNnID0gYCcke3ByZXZpb3VzX3RleHR9JyBpcyBub3QgYSB2YWxpZCBjaG9pY2UgZm9yICR7cGFyZW50X3RleHR9YDtcbiAgICAvL3NldEludmFsaWQoZWwsIG1zZyk7XG4gICAgYWRkRXJyb3Ioc2VsZWN0b3JJRCwgXCJpbnZhbGlkLWNob2ljZVwiLCBtc2cpO1xuICB9IGVsc2Uge1xuICAgIHJlbW92ZUVycm9yKHNlbGVjdG9ySUQsIFwiaW52YWxpZC1jaG9pY2VcIik7XG4gICAgLy9zZXRWYWxpZChlbCk7XG4gIH1cblxuICAkLmVhY2gobmV3T3B0aW9ucywgKHZhbHVlLCBsYWJlbCkgPT4ge1xuICAgIGVsLmFwcGVuZCgkKFwiPG9wdGlvbj48L29wdGlvbj5cIikuYXR0cihcInZhbHVlXCIsIHZhbHVlKS50ZXh0KGxhYmVsKSk7XG4gIH0pO1xuXG4gIGlmIChPYmplY3QudmFsdWVzKG5ld09wdGlvbnMpLmluY2x1ZGVzKHByZXZpb3VzX3RleHQpKSB7XG4gICAgY29uc3QgaWR4ID0gT2JqZWN0LnZhbHVlcyhuZXdPcHRpb25zKS5pbmRleE9mKHByZXZpb3VzX3RleHQpO1xuICAgIGVsLnZhbChPYmplY3Qua2V5cyhuZXdPcHRpb25zKVtpZHhdKTtcbiAgfVxufTtcblxuLyoqIHVwZGF0ZSB0aGUgY2hvaWNlcyBpbiBhIGRyb3Bkcm93biBjb250cm9sIHRvIHJlZmxlY3QgdGhlIHNlbGVjdFxudmFsdWUgaW4gYSBwYXJlbnQgd2lkZ2V0IChzcGVjaWVzIGFuZCBzdHJhaW5zKS4gIG5ldyBvcHRpb25zIGlzIGxpc3Rcbm9mIG9iamVjdHMgd2l0aCB0aGUga2V5cyAndmFsdWUnIGFuZCAndGV4dCcuICBUaGlzIHZlcnNpb24gaXMgdXNlZCBpblxudGhlIHhsc192YWxpZGF0aW9uIGZvcm0sIGRvZXMgbm90IGZsYWcgdGhlIGZpZWxkIGFzIGFuIGVycm9yLCBhbmRcbmFjY2VwdHMgYSBsaXN0IG9mIG9iamVjdHMgYXMgbmV3IE9wdGlvbnMuXG4qL1xuZXhwb3J0IGNvbnN0IHVwZGF0ZV9jaG9pY2VzID0gKHNlbGVjdG9ySUQsIHBhcmVudElELCBuZXdPcHRpb25zKSA9PiB7XG4gIGNvbnN0IGVsID0gJChgIyR7c2VsZWN0b3JJRH1gKTtcblxuICAvL2NvbnN0IHByZXZpb3VzX3ZhbCA9ICQoYCMke3NlbGVjdG9ySUR9IG9wdGlvbjpzZWxlY3RlZGApLnZhbCgpO1xuICBjb25zdCBwcmV2aW91c19zZWxlY3Rpb24gPSAkKGAjJHtzZWxlY3RvcklEfSBvcHRpb246c2VsZWN0ZWRgKTtcbiAgY29uc3QgcHJldmlvdXNfdGV4dCA9IHByZXZpb3VzX3NlbGVjdGlvbi50ZXh0KCk7XG4gIGxldCBwcmV2aW91c192YWx1ZSA9IHByZXZpb3VzX3NlbGVjdGlvbi52YWwoKTtcblxuICBjb25zdCBwYXJlbnRfdGV4dCA9ICQoYCMke3BhcmVudElEfSBvcHRpb246c2VsZWN0ZWRgKS50ZXh0KCk7XG5cbiAgZWwuZW1wdHkoKTsgLy8gcmVtb3ZlIG9sZCBvcHRpb25zXG5cbiAgLy8gaWYgdGhlIHByZXZpb3VzIHZhbHVlIGlzIG5vdCBpbiB0aGUgY3VycmVudCBsaXN0LCBhZGQgaXQgbm93OlxuICBjb25zdCB3YXNfcHJldmlvdXMgPVxuICAgIHByZXZpb3VzX3ZhbHVlID09PSBcIlwiIHx8IHByZXZpb3VzX3ZhbHVlID09PSBcIi05OTlcIiA/IHRydWUgOiBwcmV2aW91c192YWx1ZTtcbiAgaWYgKFxuICAgIHdhc19wcmV2aW91cyAmJlxuICAgIG5ld09wdGlvbnMuZmlsdGVyKCh4KSA9PiB4LnZhbHVlID09PSBwcmV2aW91c192YWx1ZSkubGVuZ3RoID09PSAwXG4gICkge1xuICAgIGVsLmFwcGVuZCgkKFwiPG9wdGlvbj5cIiwgeyB2YWx1ZTogcHJldmlvdXNfdmFsdWUsIHRleHQ6IHByZXZpb3VzX3RleHQgfSkpO1xuICB9XG5cbiAgJC5lYWNoKG5ld09wdGlvbnMsIGZ1bmN0aW9uIChpLCBpdGVtKSB7XG4gICAgZWwuYXBwZW5kKFxuICAgICAgJChcIjxvcHRpb24+XCIsIHtcbiAgICAgICAgdmFsdWU6IGl0ZW0udmFsdWUsXG4gICAgICAgIHRleHQ6IGl0ZW0udGV4dCxcbiAgICAgIH0pXG4gICAgKTtcbiAgfSk7XG5cbiAgLy8gbWFrZSBzdXJlIHRoZSBvbGQgdmFsdWUgaXMgc2VsZWN0ZWQuXG4gIGVsLnZhbChwcmV2aW91c192YWx1ZSlcbiAgICAuZmluZChgb3B0aW9uW3ZhbHVlPVwiJHtwcmV2aW91c192YWx1ZX1cIl1gKVxuICAgIC5hdHRyKFwic2VsZWN0ZWRcIiwgdHJ1ZSk7XG59O1xuXG5leHBvcnQgY29uc3Qgc2V0SW52YWxpZCA9IChmaWVsZCwgZXJyTXNnKSA9PiB7XG4gIGxldCBpZCA9IGZpZWxkLmlkID8gZmllbGQuaWQgOiBmaWVsZFswXS5pZDtcbiAgbGV0IHdyYXBwZXIgPSAkKFwiI1wiICsgaWQgKyBcIi1maWVsZFwiKTtcbiAgd3JhcHBlci5hZGRDbGFzcyhcImVycm9yXCIpO1xuICBsZXQgaW5wdXQgPSB3cmFwcGVyLmZpbmQoXCIudWkuaW5wdXRcIik7XG4gIC8vIGdldCB0aGUgY3VycmVudCBlcnJvcnMgYW5kIGFkZCBvdXIgbmV3IG9uZTpcbiAgaW5wdXQuYXR0cihcImRhdGEtaHRtbFwiLCBlcnJNc2cpLmF0dHIoXCJkYXRhLXBvc2l0aW9uXCIsIFwidG9wIGNlbnRlclwiKTtcbn07XG5cbmV4cG9ydCBjb25zdCBzZXRWYWxpZCA9IChmaWVsZCkgPT4ge1xuICBsZXQgaWQgPSBmaWVsZC5pZCA/IGZpZWxkLmlkIDogZmllbGRbMF0uaWQ7XG4gIGxldCB3cmFwcGVyID0gJChcIiNcIiArIGlkICsgXCItZmllbGRcIik7XG4gIHdyYXBwZXIucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKTtcbiAgbGV0IGlucHV0ID0gd3JhcHBlci5maW5kKFwiLnVpLmlucHV0XCIpO1xuICBpbnB1dC5yZW1vdmVBdHRyKFwiZGF0YS1odG1sXCIpLnJlbW92ZUF0dHIoXCJkYXRhLXBvc2l0aW9uXCIpO1xufTtcblxuZXhwb3J0IGNvbnN0IGFkZEVycm9yID0gKHRhcmdldGlkLCBlcnJvcmlkLCBtc2cpID0+IHtcbiAgZXJyb3JpZCA9IHRhcmdldGlkICsgXCItXCIgKyBlcnJvcmlkO1xuICBsZXQgcG9wdXAgPSAkKGAjJHt0YXJnZXRpZH0tcG9wdXBgKTtcblxuICBpZiAocG9wdXAubGVuZ3RoID09PSAwKSB7XG4gICAgbGV0IGh0bWwgPSBgPGRpdiBpZD1cIiR7dGFyZ2V0aWR9LXBvcHVwXCIgY2xhc3M9XCJ1aSBmbG93aW5nIHBvcHVwXCIgaGlkZGVuPlxuICAgICAgICAgICAgPGRpdiBpZD1cIiR7dGFyZ2V0aWR9LWVycm9yLWxpc3RcIiBjbGFzcz1cInVpIGJ1bGxldGVkIGxpc3RcIj5cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPC9kaXY+YDtcblxuICAgICQoYCMke3RhcmdldGlkfS1maWVsZGApLmFwcGVuZChodG1sKTtcbiAgfVxuXG4gICQoYCMke3RhcmdldGlkfS1maWVsZGApLmFkZENsYXNzKFwiZXJyb3JcIik7XG4gIGxldCBlcnJvckxpc3QgPSAkKGAjJHt0YXJnZXRpZH0tZXJyb3ItbGlzdGApO1xuXG4gIC8vIGRvbid0IGFwcGVuZCBkdXBsaWNhdGVzXG4gIGlmICgkKGAjJHtlcnJvcmlkfWApLmxlbmd0aCA9PT0gMCkge1xuICAgIC8vbGV0IGl0ZW1faHRtbCA9IGA8bGkgaWQ9XCIke2Vycm9yaWR9XCI+JHttc2d9PC9saT5gO1xuICAgIGxldCBpdGVtX2h0bWwgPSBgPGRpdiBjbGFzcz1cIml0ZW1cIiBpZD1cIiR7ZXJyb3JpZH1cIj4ke21zZ308L2Rpdj5gO1xuICAgIGVycm9yTGlzdC5hcHBlbmQoaXRlbV9odG1sKTtcbiAgfSBlbHNlIHtcbiAgICAvLyB1cGRhdGUgdGhlIGVycm9yIG1lc3NhZ2UgKGp1c3QgaW5jYXNlIGl0IGNoYW5nZWQpXG4gICAgJChgIyR7ZXJyb3JpZH1gKS5odG1sKG1zZyk7XG4gIH1cbn07XG5cbi8vIHJlbW92ZSB0aGUgc3BlY2lmaWVkIGVycm9yIGZyb20gdGhlIHRhcmdldCBmaWVsZFxuLy8gaWYgdGhpcyBpcyB0aGUgbGFzdCBlcnJvciwgcmVtb3ZlIHRoZSBwb3B1cCB0b29cbi8vIG5vdGUgLSByZW1vdmVpbmcgdGhlIHBvcHVwIGVudGlyZWx5IGNhdXNlcyBhbiBlcnJvciBpZiB3ZSBhZGQgaXQgYWdhaW4uXG4vLyBqdXN0IGxlYXZpbmcgYW4gZW1wdHkgcG9wdXAgaXMgYSB3b3JrYWJsZSBzb2x1dGlvbi5cbmV4cG9ydCBjb25zdCByZW1vdmVFcnJvciA9ICh0YXJnZXRpZCwgZXJyb3JpZCkgPT4ge1xuICBlcnJvcmlkID0gdGFyZ2V0aWQgKyBcIi1cIiArIGVycm9yaWQ7XG4gIGxldCBlcnJvclNlbGVjdG9yID0gYCMke3RhcmdldGlkfS1lcnJvci1saXN0ICMke2Vycm9yaWR9YDtcbiAgJChlcnJvclNlbGVjdG9yKS5yZW1vdmUoKTtcbiAgbGV0IGVycm9yTGlzdCA9ICQoYCMke3RhcmdldGlkfS1lcnJvci1saXN0IC5pdGVtYCk7XG4gIGlmIChlcnJvckxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgJChgIyR7dGFyZ2V0aWR9LXBvcHVwYCkucG9wdXAoXCJkZXN0cm95XCIpO1xuICAgICQoYCMke3RhcmdldGlkfS1maWVsZGApLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XG4gIH1cbn07XG5cbi8vIGZyb20gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjExODg0MjAvXG4vLyBjYXRjaCBBcHJpbCAzMSwgZWN0LlxuLy8gaWYgdGhlIGlucHV0IGlzIHRoZSBzYW1lIGFzIHRoZSBvdXRwdXQgd2UgYXJlIGdvb2Q6XG5leHBvcnQgY29uc3QgaXNWYWxpZERhdGUgPSAoeWVhciwgbW9udGgsIGRheSkgPT4ge1xuICBtb250aCA9IG1vbnRoIC0gMTtcbiAgbGV0IGQgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbiAgbGV0IG5vdyA9IG5ldyBEYXRlKCk7XG5cbiAgaWYgKFxuICAgIGQuZ2V0RnVsbFllYXIoKSA9PSB5ZWFyICYmXG4gICAgZC5nZXRNb250aCgpID09IG1vbnRoICYmXG4gICAgZC5nZXREYXRlKCkgPT0gZGF5ICYmXG4gICAgZCA8IG5vd1xuICApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5leHBvcnQgY29uc3QgY2hlY2tSYW5nZSA9IChmaWVsZCwgbG93ZXIsIHVwcGVyLCBpbnRlZ2VyID0gdHJ1ZSkgPT4ge1xuICBpZiAoZmllbGQudmFsdWUgPj0gbG93ZXIgJiYgZmllbGQudmFsdWUgPD0gdXBwZXIpIHtcbiAgICAvL3NldFZhbGlkKGZpZWxkKTtcbiAgICByZW1vdmVFcnJvcihmaWVsZC5pZCwgXCJvdXQtb2YtcmFuZ2VcIik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgbGV0IG1zZyA9IGAke2ZpZWxkLm5hbWV9IG11c3QgYmUgJHtcbiAgICAgIGludGVnZXIgPyBcImFuIGludGVnZXJcIiA6IFwiXCJcbiAgICB9IGJld3RlZW4gJHtsb3dlcn0gYW5kICR7dXBwZXJ9LmA7XG4gICAgLy9zZXRJbnZhbGlkKGZpZWxkLCBtc2cpO1xuICAgIGFkZEVycm9yKGZpZWxkLmlkLCBcIm91dC1vZi1yYW5nZVwiLCBtc2cpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGlzRW1wdHkgPSAodmFsdWUpID0+IHtcbiAgaWYgKHZhbHVlID09PSBcIlwiKSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNoZWNrRW1wdHkgPSAoZmllbGQpID0+IHtcbiAgaWYgKGlzRW1wdHkoZmllbGQudmFsdWUudHJpbSgpKSkge1xuICAgIC8vc2V0IGZpZWxkIGludmFsaWRcbiAgICAvL3NldEludmFsaWQoZmllbGQsIGAke2ZpZWxkLm5hbWV9IG11c3Qgbm90IGJlIGVtcHR5YCk7XG4gICAgYWRkRXJyb3IoZmllbGQuaWQsIFwiZW1wdHlcIiwgYCR7ZmllbGQubmFtZX0gbXVzdCBub3QgYmUgZW1wdHlgKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICAvL3NldCBmaWVsZCB0byB2YWxpZFxuICAgIC8vc2V0VmFsaWQoZmllbGQpO1xuICAgIHJlbW92ZUVycm9yKGZpZWxkLmlkLCBcImVtcHR5XCIpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGNoZWNrTGF0TG9uID0gKGZpZWxkKSA9PiB7XG4gIC8vIGlmIHRoaXMgaXMgbGF0LCBnZXQgbG9uLCBpZiB0aGlzIGlzIGxvbiBnZXQgbGF0IG5vdCBuZWVkIGZvclxuICAvLyBzaW5nbGUsIGV2ZW50LCBidXQgd2lsbCBiZSByZXF1aXJlZCBmb3IgZm9ybXNldCAodGhhdCB3aWxsIGhhdmVcbiAgLy8gbXV0aXBsZSBsYXRzIGFuZCBsb25ncyAtIGdldCB0aGUgb25lIGZyb20gdGhlIHNhbWUgcm93KVxuXG4gIGNvbnN0IGRkbGF0aWQgPSBmaWVsZC5pZC5yZXBsYWNlKFwibG9uXCIsIFwibGF0XCIpO1xuICBjb25zdCBkZGxvbmlkID0gZmllbGQuaWQucmVwbGFjZShcImxhdFwiLCBcImxvblwiKTtcbiAgY29uc3QgZGRsYXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZGxhdGlkKTtcbiAgY29uc3QgZGRsb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChkZGxvbmlkKTtcblxuICBpZiAoXG4gICAgKGlzRW1wdHkoZGRsYXQudmFsdWUpICYmIGlzRW1wdHkoZGRsb24udmFsdWUpKSB8fFxuICAgICghaXNFbXB0eShkZGxhdC52YWx1ZSkgJiYgIWlzRW1wdHkoZGRsb24udmFsdWUpKVxuICApIHtcbiAgICAvL3NldFZhbGlkKGRkbGF0KTtcbiAgICAvL3NldFZhbGlkKGRkbG9uKTtcbiAgICByZW1vdmVFcnJvcihkZGxhdC5pZCwgXCJsYXRsb25cIik7XG4gICAgcmVtb3ZlRXJyb3IoZGRsb24uaWQsIFwibGF0bG9uXCIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbGV0IG1zZyA9IFwiXCI7XG5cbiAgaWYgKGlzRW1wdHkoZGRsYXQudmFsdWUpKSB7XG4gICAgbXNnID0gXCJMYXRpdHVkZSBpcyByZXF1aXJlZCBpZiBsb25naXR1ZGUgaXMgcG9wdWxhdGVkLlwiO1xuICAgIC8vc2V0SW52YWxpZChkZGxhdCwgbXNnKTtcbiAgICBhZGRFcnJvcihkZGxhdC5pZCwgXCJsYXRsb25cIiwgbXNnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoaXNFbXB0eShkZGxvbi52YWx1ZSkpIHtcbiAgICBtc2cgPSBcIkxvbmdpdHVkZSBpcyByZXF1aXJlZCBpZiBMYXRpdHVkZSBpcyBwb3B1bGF0ZWQuXCI7XG4gICAgLy9zZXRJbnZhbGlkKGRkbG9uLCBtc2cpO1xuICAgIGFkZEVycm9yKGRkbG9uLmlkLCBcImxhdGxvblwiLCBtc2cpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNoZWNrRGRMYXQgPSAoZmllbGQsIGJib3gpID0+IHtcbiAgLy8gbWFrZSBzdXJlIHRoZSBsYXRpdHVkZSBpcyBiZXR3ZWVuIHRoZSBlbGVtZW50cyBvZiBvdXIgYm91bmRpbmdcbiAgLy8gYm94LlxuICBjb25zdCBsYXQgPSBwYXJzZUZsb2F0KGZpZWxkLnZhbHVlKTtcbiAgaWYgKGxhdCA8IGJib3hbMV0gfHwgbGF0ID4gYmJveFszXSkge1xuICAgIGxldCBtc2cgPSBgTGF0aXR1ZGUgbXVzdCBiZSBiZXd0ZWVuICR7YmJveFsxXS50b0ZpeGVkKFxuICAgICAgM1xuICAgICl9IGFuZCAke2Jib3hbM10udG9GaXhlZCgzKX1gO1xuICAgIC8vc2V0SW52YWxpZChmaWVsZCwgbXNnKTtcbiAgICBhZGRFcnJvcihmaWVsZC5pZCwgXCJsYXQtYm91bmRzXCIsIG1zZyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJlbW92ZUVycm9yKGZpZWxkLmlkLCBcImxhdC1ib3VuZHNcIik7XG4gIHJldHVybiB0cnVlO1xufTtcblxuZXhwb3J0IGNvbnN0IGNoZWNrRGRMb24gPSAoZmllbGQsIGJib3gpID0+IHtcbiAgLy8gbWFrZSBzdXJlIHRoZSBsb25naXR1ZGUgaXMgYmV0d2VlbiB0aGUgZWxlbWVudHMgb2Ygb3VyIGJvdW5kaW5nXG4gIC8vIGJveC5cbiAgY29uc3QgbG9uID0gcGFyc2VGbG9hdChmaWVsZC52YWx1ZSk7XG4gIGlmIChsb24gPCBiYm94WzBdIHx8IGxvbiA+IGJib3hbMl0pIHtcbiAgICBsZXQgbXNnID0gYExvbmdpdHVkZSBtdXN0IGJlIGJld3RlZW4gJHtiYm94WzBdLnRvRml4ZWQoXG4gICAgICAzXG4gICAgKX0gYW5kICR7YmJveFsyXS50b0ZpeGVkKDMpfWA7XG4gICAgLy9zZXRJbnZhbGlkKGZpZWxkLCBtc2cpO1xuICAgIGFkZEVycm9yKGZpZWxkLmlkLCBcImxvbi1ib3VuZHNcIiwgbXNnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmVtb3ZlRXJyb3IoZmllbGQuaWQsIFwibG9uLWJvdW5kc1wiKTtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLyogZ2xvYmFsIGxha2UgbXVfZ3JpZHMsIGZvcm1fZXJyb3JzLCBsYWtlX2Jib3ggKi9cblxuaW1wb3J0IHsganNvbiB9IGZyb20gXCJkM1wiO1xuXG4vLyBhdHRhY2ggYmx1ciBldmVudCB0byBlYWNoIGZpZWxkXG4vLyByZXR1cm4gZGF0YSBmcm9tIHJvdyBvbiBibHVyXG4vLyB2YWxpZGF0ZSByb3cgLSB0aGlzIHNob3VsZCBjYXB0dXJlIHJlbGF0ZWQgZmllbGRzXG5cbi8vIHNwYXRpYWwgZmllbGRzIC0gY2hlY2sgbGFrZSBhbmQgc3RhdGUoanVyaXNkaWNpdG9uKSwgc3RhdCBkaXN0cmljdCBhbmQgZ3JpZCB3aXRoIGxhdCBMb25namF3XG5cbmltcG9ydCB7IG9iamVjdCwgbnVtYmVyLCBzdHJpbmcgfSBmcm9tIFwieXVwXCI7XG5cbmltcG9ydCB7XG4gIG1ha2VfY2hvaWNlcyxcbiAgaXNWYWxpZERhdGUsXG4gIHVwZGF0ZV9jaG9pY2VzLFxufSBmcm9tIFwiLi9jb21wb25lbnRzL2Zvcm1fdXRpbHNcIjtcblxuLy8gLy8gZGF5IG1vbnRoIGFuZCB5ZWFyIG11c3QgZm9ybSB2YWxpZCBkYXRhIGlmIHBvcHVsYXRlZFxuXG5jb25zdCByZW5kZXJfZmllbGRfZXJyb3JzID0gKGZvcm1fZXJyb3JzKSA9PiB7XG4gIGZvciAoY29uc3QgW2ZsZCwgZXJyXSBvZiBPYmplY3QuZW50cmllcyhmb3JtX2Vycm9ycykpIHtcbiAgICAvLyBzZXQgdGhlIGVycm9yIGNsYXNzIG9uIHRoZSBmaWVsZDpcbiAgICBsZXQgc2VsZWN0b3IgPSBgIyR7ZmxkfS1maWVsZGA7XG4gICAgJChzZWxlY3RvcilcbiAgICAgIC5hZGRDbGFzcyhcImVycm9yXCIpXG4gICAgICAuYXR0cihcImRhdGEtdG9vbHRpcFwiLCBlcnIpXG4gICAgICAuYXR0cihcImRhdGEtdmFyaWF0aW9uXCIsIFwidGlueSBiYXNpY1wiKTtcbiAgfVxuXG4gIC8vIGlmIGZvcm1fZXJyb3JzIGhhcyBhbnkgZWxlbWVudHMgdXBkYXRlIHRoZSBlcnJvciBtZXNzYWdlIGFuZCBkaXNhYmxlIHRoZSBzdWJtaXQgYnV0dG9uXG4gIC8vIGlmIGZvcm1fZXJyb3JzIGlzIGVtcHR5IC0gZW5hYmxlIHRoZSBzdWJtaXQgYnV0dG9uIGFuZCByZW1vdmUgdGhlIGVycm9ycy1jb3VudC5cbiAgY29uc3QgZXJyb3JfY291bnQgPSBPYmplY3Qua2V5cyhmb3JtX2Vycm9ycykubGVuZ3RoO1xuICBpZiAoZXJyb3JfY291bnQpIHtcbiAgICAvLyBzZWxlY3QgdGhlIHN1Ym1pdCBidXR0b246XG4gICAgJChcIiN1cGxvYWQtZXZlbnRzLWJ1dHRvblwiKS5wcm9wKFwiZGlzYWJsZWRcIiwgdHJ1ZSk7XG4gICAgJChcIiNmb3JtLWVycm9ycy1tZXNzYWdlXCIpXG4gICAgICAucmVtb3ZlQ2xhc3MoXCJmb3JtLXZhbGlkLW1lc3NhZ2VcIilcbiAgICAgIC5hZGRDbGFzcyhcImZvcm0tZXJyb3ItbWVzc2FnZVwiKVxuICAgICAgLmh0bWwoYCR7ZXJyb3JfY291bnR9IEVycm9yJHtlcnJvcl9jb3VudCA+IDEgPyBcInNcIiA6IFwiXCJ9IEZvdW5kLmApO1xuICB9IGVsc2Uge1xuICAgICQoXCIjdXBsb2FkLWV2ZW50cy1idXR0b25cIikucHJvcChcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAkKFwiI2Zvcm0tZXJyb3JzLW1lc3NhZ2VcIilcbiAgICAgIC5yZW1vdmVDbGFzcyhcImZvcm0tZXJyb3ItbWVzc2FnZVwiKVxuICAgICAgLmFkZENsYXNzKFwiZm9ybS12YWxpZC1tZXNzYWdlXCIpXG4gICAgICAuaHRtbChcIk5vIEVycm9ycyBGb3VuZFwiKTtcbiAgfVxufTtcblxuY29uc3QgZ2V0X2Nob2ljZXMgPSAoZmllbGRfbmFtZSkgPT4ge1xuICBjb25zdCBzZWxlY3QgPSAkKGAjaWRfZm9ybS0wLSR7ZmllbGRfbmFtZX0gb3B0aW9uYCk7XG4gIGNvbnN0IGNob2ljZXMgPSAkLm1hcChzZWxlY3QsIGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHgudmFsdWU7XG4gIH0pO1xuICByZXR1cm4gY2hvaWNlcztcbn07XG5cbmNvbnN0IGNsZWFyX3Jvd19maWVsZF9lcnJvcnMgPSAocm93X3ByZWZpeCkgPT4ge1xuICAvLyBnaXZlbiBhIHJvdyBpZGVudGlmaWVyLCByZW1vdmUgYWxsIG9mIHRoZSBlcnJvcnMgaW4gdGhlIHJvdzpcbiAgJChgIyR7cm93X3ByZWZpeH0tcm93IDppbnB1dGApLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICQodGhpcylcbiAgICAgIC5wYXJlbnRzKFwiLmZpZWxkXCIpXG4gICAgICAucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKVxuICAgICAgLnJlbW92ZUF0dHIoXCJkYXRhLXRvb2x0aXBcIilcbiAgICAgIC5yZW1vdmUoXCJkYXRhLXZhcmlhdGlvblwiKTtcbiAgfSk7XG59O1xuXG5jb25zdCBjbGVhcl9maWVsZF9lcnJvciA9IChmaWVsZF9pZCkgPT4ge1xuICBsZXQgc2VsZWN0b3IgPSBgIyR7ZmllbGRfaWR9LWZpZWxkYDtcbiAgJChzZWxlY3RvcilcbiAgICAucmVtb3ZlQ2xhc3MoXCJlcnJvclwiKVxuICAgIC5yZW1vdmVBdHRyKFwiZGF0YS10b29sdGlwXCIpXG4gICAgLnJlbW92ZUF0dHIoXCJkYXRhLXZhcmlhdGlvblwiKTtcbn07XG5cbmNvbnN0IGdldF9yb3dfdmFsdWVzID0gKHJvd19zZWxlY3RvcikgPT4ge1xuICAvLyByb3cgc2xlY3RvciBzaG91bGQgYmUgb2YgdGhlIGZvcm0gJ2lkX2Zvcm0tOCdcbiAgbGV0IHZhbHVlcyA9IHt9O1xuICBsZXQgcm93ID0gJChgIyR7cm93X3NlbGVjdG9yfS1yb3cgOmlucHV0YCk7XG4gIHJvdy5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICB2YWx1ZXNbXG4gICAgICAkKHRoaXMpXG4gICAgICAgIC5hdHRyKFwiaWRcIilcbiAgICAgICAgLnJlcGxhY2Uocm93X3NlbGVjdG9yICsgXCItXCIsIFwiXCIpXG4gICAgXSA9ICQodGhpcykudmFsKCk7XG4gIH0pO1xuXG4gIGNvbnN0IGFkZF9yb3dfZXJyb3IgPSAocm93X3NlbGVjdG9yKSA9PiB7XG4gICAgJChgIyR7cm93X3NlbGVjdG9yfS1pY29uYCkuYXR0cihcImNsYXNzXCIsIFwicmVkIGFycm93IHJpZ2h0XCIpO1xuICAgICQoYCMke3Jvd19zZWxlY3Rvcn0tcm93YCkuYWRkQ2xhc3MoXCJlcnJvclwiKTtcbiAgfTtcblxuICBjb25zdCBjbGVhcl9yb3dfZXJyb3IgPSAocm93X3NlbGVjdG9yKSA9PiB7XG4gICAgJChgIyR7cm93X3NlbGVjdG9yfS1pY29uYCkuYXR0cihcImNsYXNzXCIsIFwiZ3JlZW4gY2hlY2sgaWNvblwiKTtcbiAgICAkKGAjJHtyb3dfc2VsZWN0b3J9LXJvd2ApLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XG4gIH07XG5cbiAgdmFsdWVzLm1vbnRoID0gdmFsdWVzLm1vbnRoID09PSBcIlwiID8gdW5kZWZpbmVkIDogK3ZhbHVlcy5tb250aDtcbiAgdmFsdWVzLmRheSA9IHZhbHVlcy5kYXkgPT09IFwiXCIgPyB1bmRlZmluZWQgOiArdmFsdWVzLmRheTtcblxuICB2YWx1ZXMubGF0aXR1ZGUgPSB2YWx1ZXMubGF0aXR1ZGUgPT09IFwiXCIgPyB1bmRlZmluZWQgOiArdmFsdWVzLmxhdGl0dWRlO1xuICB2YWx1ZXMubG9uZ2l0dWRlID0gdmFsdWVzLmxvbmdpdHVkZSA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6ICt2YWx1ZXMubG9uZ2l0dWRlO1xuICB2YWx1ZXMud2VpZ2h0ID0gdmFsdWVzLndlaWdodCA/ICt2YWx1ZXMud2VpZ2h0IDogdW5kZWZpbmVkO1xuXG4gIHJldHVybiB2YWx1ZXM7XG59O1xuXG5sZXQgYWdlbmN5X2Nob2ljZXMgPSBbXTtcbmxldCBsYWtlX2Nob2ljZXMgPSBbXTtcbmxldCBzdGF0ZXByb3ZfY2hvaWNlcyA9IFtdO1xubGV0IHN0YXREaXN0X2Nob2ljZXMgPSBbXTtcbmxldCBncmlkMTBfY2hvaWNlcyA9IFtdO1xubGV0IHNwZWNpZXNfY2hvaWNlcyA9IFtdO1xubGV0IHN0cmFpbl9jaG9pY2VzID0gW107XG5sZXQgY2xpcGNvZGVfY2hvaWNlcyA9IFtdO1xubGV0IGxpZmVzdGFnZV9jaG9pY2VzID0gW107XG5sZXQgc3RvY2tpbmdfbWV0aG9kX2Nob2ljZXMgPSBbXTtcblxuLy8gdGFncywgbWFya3MsIGhhdGNoZXJ5XG5cblByb21pc2UuYWxsKFtcbiAganNvbihcIi9hcGkvdjEvc3RvY2tpbmcvbG9va3Vwc1wiKSxcbiAganNvbihcIi9hcGkvdjEvY29tbW9uL2xvb2t1cHNcIiksXG5dKS50aGVuKChbc3RvY2tpbmcsIGNvbW1vbl0pID0+IHtcbiAgLy8gc3RhdERpc3QsIGdyaWQgYW5kIHN0cmFpbiBhcmUgYWxsIG9iamVjdGVkIGtleWVkIGJ5IHRoZWlyIHJlc3BlY3RpdmUgcGFyZW50c1xuXG4gIC8vIHN0YXRlL3Byb3YgY2hvaWNlcyBrZXllZCBieSBsYWtlXG4gIC8vIG1hbmFnZW1lbnQgdW5pdCBjaG9pY2VzIGtleWVkIGJ5IGxha2Uvc3RhdCBwcm92IG9yIGp1cmlzZGljdGlvblxuICAvLyBncmlkIGNob2ljZXMga2V5ZWQgYnkgbXUuXG4gIC8vIHN0cmFpbiBjaG9pY2VzIGFyZSBrZXllZCBieSBzcGVjaWVzXG5cbiAgc3RhdGVwcm92X2Nob2ljZXMgPSBjb21tb24uanVyaXNkaWN0aW9uc1xuICAgIC5maWx0ZXIoKHgpID0+IHgubGFrZS5hYmJyZXYgPT09IGxha2UpXG4gICAgLm1hcCgoZCkgPT4gKHsgdmFsdWU6IGQuc3RhdGVwcm92LmFiYnJldiwgdGV4dDogZC5zdGF0ZXByb3YubmFtZSB9KSk7XG5cbiAgc3RhdERpc3RfY2hvaWNlcyA9IG1ha2VfY2hvaWNlcyhcbiAgICBjb21tb24ubWFuVW5pdHNcbiAgICAgIC5maWx0ZXIoKHgpID0+IHguanVyaXNkaWN0aW9uLmxha2UuYWJicmV2ID09PSBsYWtlKVxuICAgICAgLm1hcCgoZCkgPT4gW1xuICAgICAgICBkLmp1cmlzZGljdGlvbi5zdGF0ZXByb3YuYWJicmV2LFxuICAgICAgICB7IHZhbHVlOiBkLmxhYmVsLCB0ZXh0OiBkLmxhYmVsIH0sXG4gICAgICBdKVxuICApO1xuICBncmlkMTBfY2hvaWNlcyA9IG1ha2VfY2hvaWNlcyhcbiAgICBtdV9ncmlkcy5tYXAoKGQpID0+IFtkWzBdLCB7IHZhbHVlOiBkWzFdLCB0ZXh0OiBkWzFdIH1dKVxuICApO1xuXG4gIHNwZWNpZXNfY2hvaWNlcyA9IGNvbW1vbltcInNwZWNpZXNcIl1cbiAgICAuZmlsdGVyKChkKSA9PiBkLmFjdGl2ZSA9PT0gdHJ1ZSlcbiAgICAubWFwKCh4KSA9PiB4LmFiYnJldik7XG5cbiAgY2xpcGNvZGVfY2hvaWNlcyA9IGNvbW1vbltcImNsaXBjb2Rlc1wiXS5tYXAoKHgpID0+IHguY2xpcF9jb2RlKTtcblxuICBzdG9ja2luZ19tZXRob2RfY2hvaWNlcyA9IHN0b2NraW5nW1wic3RvY2tpbmdtZXRob2RzXCJdLm1hcCgoeCkgPT4geC5zdGtfbWV0aCk7XG4gIGxpZmVzdGFnZV9jaG9pY2VzID0gc3RvY2tpbmdbXCJsaWZlc3RhZ2VzXCJdLm1hcCgoeCkgPT4geC5hYmJyZXYpO1xuXG4gIHN0cmFpbl9jaG9pY2VzID0gbWFrZV9jaG9pY2VzKFxuICAgIC8vIG9iamVjdCBrZXllZCBieSBzcGVjaWVzIHdpdGggYXJyYXkgb2YgMiBlbGVtZW50IGFycmF5c1xuICAgIC8vIHN0cmFpbiBjb2RlIChzdHJhaW4gbGFiZWwpXG4gICAgY29tbW9uLnJhd19zdHJhaW5zXG4gICAgICAuZmlsdGVyKChkKSA9PiBkLmFjdGl2ZSA9PT0gdHJ1ZSlcbiAgICAgIC5tYXAoKHgpID0+IHtcbiAgICAgICAgLy9jb25zdCBsYWJlbCA9IGAke3gucmF3X3N0cmFpbn0gKCR7eC5kZXNjcmlwdGlvbn0pYDtcbiAgICAgICAgcmV0dXJuIFt4LnNwZWNpZXNfX2FiYnJldiwgeyB2YWx1ZTogeC5yYXdfc3RyYWluLCB0ZXh0OiB4LnJhd19zdHJhaW4gfV07XG4gICAgICB9KVxuICApO1xuXG4gIC8vIGNob2ljZXMgZm9yIGhhdGNoZXJpZXMsIGZpbmNsaXBzLCBwaHlzY2hlbV9tYXJrcyBhbmQgdGFnX3R5cGVzIGNhbiBjb21lIGZyb20gdGhlIGZpcnN0IHJvd1xuICAvLyBvZiBvdXIgZm9ybSAtIHRoZXJlIGlzIGN1cnJlbnRseSBubyBhcGksIGFuZCB0aGUgdmFsdWVzIGluIHRob3NlIHNlbGVjdCB3aWRnZXRzIGFyZSBjb21wbGV0ZVxuICAvLyBhbmQgY29uc2lzdGVudCBmb3IgYWxsIG90aGVyIHJvd3M6XG5cbiAgLy8gY29uc3QgaGF0Y2hlcnlfc2VsZWN0ID0gJChcIiNpZF9mb3JtLTAtaGF0Y2hlcnkgb3B0aW9uXCIpO1xuICAvLyBjb25zdCBoYXRjaGVyeV9jaG9pY2VzID0gJC5tYXAoaGF0Y2hlcnlfc2VsZWN0LCBmdW5jdGlvbiAoeCkge1xuICAvLyAgIHJldHVybiB4LnZhbHVlO1xuICAvLyB9KTtcblxuICAvL2NvbnN0IGZpbmNsaXBfY2hvaWNlcyA9IGdldF9jaG9pY2VzKFwiZmluY2xpcFwiKTtcbiAgY29uc3QgY29uZGl0aW9uX2Nob2ljZXMgPSBnZXRfY2hvaWNlcyhcImNvbmRpdGlvblwiKTtcbiAgY29uc3QgcGh5c2NoZW1fbWFya19jaG9pY2VzID0gZ2V0X2Nob2ljZXMoXCJwaHlzY2hlbV9tYXJrXCIpO1xuICBjb25zdCB0YWdfdHlwZV9jaG9pY2VzID0gZ2V0X2Nob2ljZXMoXCJ0YWdfdHlwZVwiKTtcbiAgY29uc3QgaGF0Y2hlcnlfY2hvaWNlcyA9IGdldF9jaG9pY2VzKFwiaGF0Y2hlcnlcIik7XG5cbiAgY29uc3QgW21pbkxvbiwgbWluTGF0LCBtYXhMb24sIG1heExhdF0gPSBsYWtlX2Jib3g7XG4gIGNvbnN0IGN3dF9yZWdleCA9IC9eWzAtOV17Nn0oKCx8OylbMC05XXs2fSkqKCx8Oyk/JC87XG4gIGNvbnN0IHRoaXNZZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuXG4gIGxldCBzY2hlbWEgPSBvYmplY3QoKS5zaGFwZShcbiAgICB7XG4gICAgICAvLyBzdG9ja19pZDogeXVwXG4gICAgICAvLyAgIC5udW1iZXIoKVxuICAgICAgLy8gICAubnVsbGFibGUodHJ1ZSlcbiAgICAgIC8vICAgLnRyYW5zZm9ybSgoXywgdmFsKSA9PiAodmFsID09PSB2YWwgPyB2YWwgOiBudWxsKSksXG5cbiAgICAgIHN0YXRlX3Byb3Y6IHN0cmluZygpXG4gICAgICAgIC5yZXF1aXJlZCgpXG4gICAgICAgIC5vbmVPZihzdGF0ZXByb3ZfY2hvaWNlcy5tYXAoKHgpID0+IHgudmFsdWUpKSxcblxuICAgICAgeWVhcjogbnVtYmVyKClcbiAgICAgICAgLnJlcXVpcmVkKFwiWWVhciBpcyByZXF1aXJlZFwiKVxuICAgICAgICAucG9zaXRpdmUoXCJZZWFyIG11c3QgYmUgcG9zaXRpdmVcIilcbiAgICAgICAgLm1pbigxOTUwLCBcIlllYXIgbXVzdCBiZSBhZnRlciAxOTUwXCIpXG4gICAgICAgIC5tYXgodGhpc1llYXIsIGBZZWFyIG11c3QgYmUgbGVzcyB0aGFuIHRvZGF5ICgke3RoaXNZZWFyfSlgKSxcbiAgICAgIG1vbnRoOiBudW1iZXIoKVxuICAgICAgICAvLy5yZXF1aXJlZChcIk1vbnRoIGlzIHJlcXVpcmVkXCIpXG4gICAgICAgIC5udWxsYWJsZSgpXG4gICAgICAgIC5wb3NpdGl2ZShcIk1vbnRoIG11c3QgYmUgcG9zaXRpdmVcIilcbiAgICAgICAgLm1pbigxLCBcIk1vbnRoIG11c3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDFcIilcbiAgICAgICAgLm1heCgxMiwgXCJNb250aCBtdXN0IGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byAxMlwiKVxuICAgICAgICAud2hlbihcImRheVwiLCB7XG4gICAgICAgICAgaXM6IChkYXkpID0+IHR5cGVvZiBkYXkgIT09IFwidW5kZWZpbmVkXCIsXG4gICAgICAgICAgdGhlbjogbnVtYmVyKCkucmVxdWlyZWQoXCJNb250aCBpcyByZXF1aXJlZCBpZiBkYXkgaXMgcHJvdmlkZWRcIiksXG4gICAgICAgICAgb3RoZXJ3aXNlOiBudW1iZXIoKS5udWxsYWJsZSh0cnVlKSxcbiAgICAgICAgfSksXG4gICAgICBkYXk6IG51bWJlcigpXG4gICAgICAgIC5wb3NpdGl2ZShcIkRheSBtdXN0IGJlIHBvc2l0aXZlXCIpXG4gICAgICAgIC5taW4oMSwgXCJEYXkgbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMVwiKVxuICAgICAgICAubWF4KDMxLCBcIkRheSBtdXN0IGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byAzMVwiKVxuICAgICAgICAubnVsbGFibGUodHJ1ZSlcbiAgICAgICAgLnRlc3QoXG4gICAgICAgICAgXCJpcy12YWxpZC1kYXRlXCIsXG4gICAgICAgICAgXCJkYXktbW9udGgteWVhciBkbyBub3QgZm9ybSBhIHZhbGlkZSBkYXRlLlwiLFxuICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSwgY29udGV4dCkge1xuICAgICAgICAgICAgY29uc3QgeyB5ZWFyLCBtb250aCB9ID0gY29udGV4dC5wYXJlbnQ7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICh0eXBlb2YgbW9udGggIT09IFwidW5kZWZpbmVkXCIpICZcbiAgICAgICAgICAgICAgKHR5cGVvZiB2YWx1ZSAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gaXNWYWxpZERhdGUoeWVhciwgbW9udGgsIHZhbHVlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKSxcblxuICAgICAgc2l0ZTogc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgICAgIHN0X3NpdGU6IHN0cmluZygpXG4gICAgICAgIC5udWxsYWJsZSh0cnVlKVxuICAgICAgICAudHJhbnNmb3JtKChfLCB2YWwpID0+ICh2YWwgPT09IHZhbCA/IHZhbCA6IG51bGwpKSxcbiAgICAgIGxhdGl0dWRlOiBudW1iZXIoKS53aGVuKFwibG9uZ2l0dWRlXCIsIHtcbiAgICAgICAgaXM6IChsb25naXR1ZGUpID0+XG4gICAgICAgICAgKHR5cGVvZiBsb25naXR1ZGUgIT09IFwidW5kZWZpbmVkXCIpICYgKGxvbmdpdHVkZSAhPT0gMCksXG4gICAgICAgIHRoZW46IG51bWJlcigpXG4gICAgICAgICAgLnJlcXVpcmVkKFwiTGF0aXR1ZGUgaXMgcmVxdWlyZWQgaWYgTG9uZ2l0dWRlIGlzIHBvcHVsYXRlZFwiKVxuICAgICAgICAgIC5taW4oXG4gICAgICAgICAgICBtaW5MYXQsXG4gICAgICAgICAgICBgTGF0aXR1ZGUgbXVzdCBiZSBncmVhdGVyIHRoYW4gJHttaW5MYXQudG9GaXhlZCgzKX0gZGVncmVlc2BcbiAgICAgICAgICApXG4gICAgICAgICAgLm1heChcbiAgICAgICAgICAgIG1heExhdCxcbiAgICAgICAgICAgIGBMYXRpdHVkZSBtdXN0IGJlIGxlc3MgdGhhbiAke21heExhdC50b0ZpeGVkKDMpfSBkZWdyZWVzYFxuICAgICAgICAgICksXG4gICAgICB9KSxcbiAgICAgIGxvbmdpdHVkZTogbnVtYmVyKCkud2hlbihcImxhdGl0dWRlXCIsIHtcbiAgICAgICAgaXM6IChsYXRpdHVkZSkgPT4gKHR5cGVvZiBsYXRpdHVkZSAhPT0gXCJ1bmRlZmluZWRcIikgJiAobGF0aXR1ZGUgIT09IDApLFxuICAgICAgICB0aGVuOiBudW1iZXIoKVxuICAgICAgICAgIC5yZXF1aXJlZChcIkxvbmdpdHVkZSBpcyByZXF1aXJlZCBpZiBMYXRpdHVkZSBpcyBwb3B1bGF0ZWRcIilcbiAgICAgICAgICAubWluKFxuICAgICAgICAgICAgbWluTG9uLFxuICAgICAgICAgICAgYExvbmdpdHVkZSBtdXN0IGJlIG5lZ2F0aXZlIGFuZCBncmVhdGVyIHRoYW4gJHttaW5Mb24udG9GaXhlZChcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKX0gZGVncmVlc2BcbiAgICAgICAgICApXG4gICAgICAgICAgLm1heChcbiAgICAgICAgICAgIG1heExvbixcbiAgICAgICAgICAgIGBMb25naXR1ZGUgbXVzdCBiZSBuZWdhdGl2ZSBhbmQgbGVzcyB0aGFuICR7bWF4TG9uLnRvRml4ZWQoXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICl9IGRlZ3JlZXNgXG4gICAgICAgICAgKSxcbiAgICAgIH0pLFxuXG4gICAgICBzdGF0X2Rpc3Q6IHN0cmluZygpXG4gICAgICAgIC5yZXF1aXJlZCgpXG4gICAgICAgIC53aGVuKFwic3RhdGVfcHJvdlwiLCAoc3RhdGVfcHJvdiwgc2NoZW1hKSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgc3RyaW5nKClcbiAgICAgICAgICAgICAgLm9uZU9mKHN0YXRlcHJvdl9jaG9pY2VzLm1hcCgoeCkgPT4geC52YWx1ZSkpXG4gICAgICAgICAgICAgIC5yZXF1aXJlZCgpXG4gICAgICAgICAgICAgIC5pc1ZhbGlkKHN0YXRlX3Byb3YpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gc2NoZW1hLm9uZU9mKFxuICAgICAgICAgICAgICBzdGF0RGlzdF9jaG9pY2VzW3N0YXRlX3Byb3ZdLm1hcCgoeCkgPT4geC52YWx1ZSksXG4gICAgICAgICAgICAgIGBub3QgYSB2YWxpZCBzdGF0X2Rpc3QgZm9yICR7c3RhdGVfcHJvdn1gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc2NoZW1hO1xuICAgICAgICB9KSxcblxuICAgICAgZ3JpZDogc3RyaW5nKClcbiAgICAgICAgLnJlcXVpcmVkKClcbiAgICAgICAgLndoZW4oW1wic3RhdF9kaXN0XCIsIFwic3RhdGVfcHJvdlwiXSwgKHN0YXRfZGlzdCwgc3RhdGVfcHJvdiwgc2NoZW1hKSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgc3RyaW5nKClcbiAgICAgICAgICAgICAgLm9uZU9mKHN0YXREaXN0X2Nob2ljZXNbc3RhdGVfcHJvdl0ubWFwKCh4KSA9PiB4LnZhbHVlKSlcbiAgICAgICAgICAgICAgLnJlcXVpcmVkKClcbiAgICAgICAgICAgICAgLmlzVmFsaWQoc3RhdF9kaXN0KVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgcmV0dXJuIHNjaGVtYS5vbmVPZihcbiAgICAgICAgICAgICAgZ3JpZDEwX2Nob2ljZXNbc3RhdF9kaXN0XS5tYXAoKHgpID0+IHgudmFsdWUpLFxuICAgICAgICAgICAgICBgbm90IGEgdmFsaWQgZ3JpZCBmb3IgJHtzdGF0X2Rpc3R9YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICAgICAgfSksXG5cbiAgICAgIHNwZWNpZXM6IHN0cmluZygpLnJlcXVpcmVkKCkub25lT2Yoc3BlY2llc19jaG9pY2VzKSxcbiAgICAgIHN0cmFpbjogc3RyaW5nKClcbiAgICAgICAgLnJlcXVpcmVkKClcbiAgICAgICAgLndoZW4oXCJzcGVjaWVzXCIsIChzcGVjaWVzLCBzY2hlbWEpID0+IHtcbiAgICAgICAgICBpZiAoc3RyaW5nKCkub25lT2Yoc3BlY2llc19jaG9pY2VzKS5yZXF1aXJlZCgpLmlzVmFsaWQoc3BlY2llcykpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2hlbWEub25lT2YoXG4gICAgICAgICAgICAgIHN0cmFpbl9jaG9pY2VzW3NwZWNpZXNdLm1hcCgoeCkgPT4geC52YWx1ZSksXG4gICAgICAgICAgICAgIGBub3QgYSB2YWxpZCBzdHJhaW4gZm9yICR7c3BlY2llc31gXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gc2NoZW1hO1xuICAgICAgICB9KSxcblxuICAgICAgbm9fc3RvY2tlZDogbnVtYmVyKClcbiAgICAgICAgLnJlcXVpcmVkKClcbiAgICAgICAgLnBvc2l0aXZlKFwiRW5zdXJlIHRoaXMgdmFsdWUgaXMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDFcIilcbiAgICAgICAgLmludGVnZXIoKSwgLy8gbWluIGFuZCBtYXhcbiAgICAgIHllYXJfY2xhc3M6IG51bWJlcigpXG4gICAgICAgIC5yZXF1aXJlZChcIlllYXIgQ2xhc3MgaXMgcmVxdWlyZWRcIilcbiAgICAgICAgLnBvc2l0aXZlKFwiWWVhciBDbGFzcyBtdXN0IGJlIHBvc2l0aXZlXCIpXG4gICAgICAgIC5taW4oMTk1MCwgXCJZZWFyIG11c3QgYmUgYWZ0ZXIgMTk0NVwiKVxuICAgICAgICAubWF4KHRoaXNZZWFyLCBgWWVhciBDbGFzcyBtdXN0IGJlIGxlc3MgdGhhbiB0b2RheSAoJHt0aGlzWWVhcn0pYCksXG4gICAgICBzdGFnZTogc3RyaW5nKClcbiAgICAgICAgLm9uZU9mKFtcIlwiLCAuLi5saWZlc3RhZ2VfY2hvaWNlc10sIFwiVW5rbm93biBMaWZlc3RhZ2UuXCIpXG4gICAgICAgIC5yZXF1aXJlZCgpLFxuICAgICAgYWdlbW9udGg6IG51bWJlcigpLnBvc2l0aXZlKCkuaW50ZWdlcigpLFxuXG4gICAgICB0YWdfbm86IHN0cmluZygpLm1hdGNoZXMoY3d0X3JlZ2V4LCB7XG4gICAgICAgIGV4Y2x1ZGVFbXB0eVN0cmluZzogdHJ1ZSxcbiAgICAgICAgbWVzc2FnZTpcbiAgICAgICAgICBcImN3dHMgbXVzdCBiZSBleGFjdGx5IDYgZGlnaXRzIHNlcGFyYXRlZCBieSBhIGNvbW1hIG9yIHNlbWljb2xvblwiLFxuICAgICAgfSksXG4gICAgICB0YWdfcmV0OiBudW1iZXIoKVxuICAgICAgICAubnVsbGFibGUodHJ1ZSlcbiAgICAgICAgLnR5cGVFcnJvcihcIk11c3QgYmUgYSB2YWxpZCBudW1iZXIuXCIpXG4gICAgICAgIC50cmFuc2Zvcm0oKHZhbHVlLCBvcmlnaW5hbFZhbHVlKSA9PlxuICAgICAgICAgIFN0cmluZyhvcmlnaW5hbFZhbHVlKS50cmltKCkgPT09IFwiXCIgPyBudWxsIDogdmFsdWVcbiAgICAgICAgKVxuICAgICAgICAucG9zaXRpdmUoKSxcbiAgICAgIGxlbmd0aDogbnVtYmVyKFwiRW50ZXIgYSBudW1iZXIuXCIpXG4gICAgICAgIC5udWxsYWJsZSh0cnVlKVxuICAgICAgICAudHlwZUVycm9yKFwiTXVzdCBiZSBhIHZhbGlkIG51bWJlci5cIilcbiAgICAgICAgLnRyYW5zZm9ybSgodmFsdWUsIG9yaWdpbmFsVmFsdWUpID0+XG4gICAgICAgICAgU3RyaW5nKG9yaWdpbmFsVmFsdWUpLnRyaW0oKSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZVxuICAgICAgICApXG4gICAgICAgIC5taW4oMSwgXCJMZW5ndGggbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMVwiKVxuICAgICAgICAucG9zaXRpdmUoXCJFbnN1cmUgdGhpcyB2YWx1ZSBpcyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMVwiKSxcbiAgICAgIHdlaWdodDogbnVtYmVyKFwiRW50ZXIgYSBudW1iZXIuXCIpXG4gICAgICAgIC5udWxsYWJsZSh0cnVlKVxuICAgICAgICAudHlwZUVycm9yKFwiTXVzdCBiZSBhIHZhbGlkIG51bWJlci5cIilcbiAgICAgICAgLnRyYW5zZm9ybSgodmFsdWUsIG9yaWdpbmFsVmFsdWUpID0+XG4gICAgICAgICAgU3RyaW5nKG9yaWdpbmFsVmFsdWUpLnRyaW0oKSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZVxuICAgICAgICApXG4gICAgICAgIC5taW4oMC4xLCBcIldlaWdodCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byAxXCIpXG4gICAgICAgIC5wb3NpdGl2ZShcIkVuc3VyZSB0aGlzIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byAwLjFcIiksXG4gICAgICBjb25kaXRpb246IHN0cmluZygpXG4gICAgICAgIC5udWxsYWJsZSh0cnVlKVxuICAgICAgICAub25lT2YoW1wiXCIsIC4uLmNvbmRpdGlvbl9jaG9pY2VzXSwgXCJVbmtub3duIENvbmRpdGlvbiBDb2RlLlwiKVxuICAgICAgICAudHJhbnNmb3JtKChfLCB2YWwpID0+ICh2YWwgPT09IHZhbCA/IHZhbCA6IG51bGwpKSxcbiAgICAgIGxvdF9jb2RlOiBzdHJpbmcoKVxuICAgICAgICAubnVsbGFibGUodHJ1ZSlcbiAgICAgICAgLnRyYW5zZm9ybSgoXywgdmFsKSA9PiAodmFsID09PSB2YWwgPyB2YWwgOiBudWxsKSksXG4gICAgICBzdG9ja19tZXRoOiBzdHJpbmcoKS5vbmVPZihcbiAgICAgICAgW1wiXCIsIC4uLnN0b2NraW5nX21ldGhvZF9jaG9pY2VzXSxcbiAgICAgICAgXCJVbmtub3duIFN0b2NraW5nIE1ldGhvZC5cIlxuICAgICAgKSxcbiAgICAgIG5vdGVzOiBzdHJpbmcoKVxuICAgICAgICAubnVsbGFibGUodHJ1ZSlcbiAgICAgICAgLnRyYW5zZm9ybSgoXywgdmFsKSA9PiAodmFsID09PSB2YWwgPyB2YWwgOiBudWxsKSksXG4gICAgICBoYXRjaGVyeTogc3RyaW5nKClcbiAgICAgICAgLnRyYW5zZm9ybSgoXywgdmFsKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHZhbCA9PT0gdmFsID8gdmFsIDogbnVsbDtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uZU9mKFtcIlwiLCAuLi5oYXRjaGVyeV9jaG9pY2VzXSwgXCJVbmtub3duIEhhdGNoZXJ5IEFiYnJldi5cIiksXG4gICAgICBhZ2VuY3lfc3RvY2tfaWQ6IHN0cmluZygpXG4gICAgICAgIC5udWxsYWJsZSh0cnVlKVxuICAgICAgICAudHJhbnNmb3JtKChfLCB2YWwpID0+ICh2YWwgPT09IHZhbCA/IHZhbCA6IG51bGwpKSxcbiAgICAgIGZpbmNsaXA6IHN0cmluZygpXG4gICAgICAgIC5vbmVPZihbXCJcIiwgLi4uY2xpcGNvZGVfY2hvaWNlc10sIFwiVW5rbm93biBDb21wb3NpdGUgQ2xpcCBDb2RlXCIpXG4gICAgICAgIC50ZXN0KFxuICAgICAgICAgIFwiQ2xpcCBjb250YWlucyBCUFwiLFxuICAgICAgICAgICdCUCBpcyBub3QgYSB2YWxpZCBDb21wb3NpdGUgQ2xpcC4gRGlkIHlvdSBtZWFuIFwiTFBSUFwiJyxcbiAgICAgICAgICAodmFsdWUpID0+ICEvQlAvLnRlc3QodmFsdWUpXG4gICAgICAgIClcbiAgICAgICAgLnRlc3QoXG4gICAgICAgICAgXCJDbGlwIGNvbnRhaW5zIEJWXCIsXG4gICAgICAgICAgJ0JWIGlzIG5vdCBhIHZhbGlkIENvbXBvc2l0ZSBDbGlwLiBEaWQgeW91IG1lYW4gXCJMVlJWXCInLFxuICAgICAgICAgICh2YWx1ZSkgPT4gIS9CVi8udGVzdCh2YWx1ZSlcbiAgICAgICAgKSxcblxuICAgICAgY2xpcF9lZmZpY2llbmN5OiBudW1iZXIoKVxuICAgICAgICAucG9zaXRpdmUoKVxuICAgICAgICAubnVsbGFibGUodHJ1ZSlcbiAgICAgICAgLnRyYW5zZm9ybSgodmFsdWUsIG9yaWdpbmFsVmFsdWUpID0+XG4gICAgICAgICAgU3RyaW5nKG9yaWdpbmFsVmFsdWUpLnRyaW0oKSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZVxuICAgICAgICApLFxuICAgICAgcGh5c2NoZW1fbWFyazogc3RyaW5nKClcbiAgICAgICAgLm51bGxhYmxlKHRydWUpXG4gICAgICAgIC5vbmVPZihbXCJcIiwgLi4ucGh5c2NoZW1fbWFya19jaG9pY2VzXSwgXCJVbmtub3duIFBoeXNDaGVtIE1hcmsuXCIpXG4gICAgICAgIC50cmFuc2Zvcm0oKF8sIHZhbCkgPT4gKHZhbCA9PT0gdmFsID8gdmFsIDogbnVsbCkpLFxuXG4gICAgICB0YWdfdHlwZTogc3RyaW5nKClcbiAgICAgICAgLm51bGxhYmxlKHRydWUpXG4gICAgICAgIC5vbmVPZihbXCJcIiwgLi4udGFnX3R5cGVfY2hvaWNlc10sIFwiVW5rbm93biBUYWcgVHlwZS5cIilcbiAgICAgICAgLnRyYW5zZm9ybSgoXywgdmFsKSA9PiAodmFsID09PSB2YWwgPyB2YWwgOiBudWxsKSksXG4gICAgfSxcbiAgICBbW1wibGF0aXR1ZGVcIiwgXCJsb25naXR1ZGVcIl0sIFtcImRheVwiXV1cbiAgKTtcblxuICBjb25zdCB2YWxpZGF0ZV92YWx1ZXMgPSBhc3luYyAodmFsdWVzKSA9PiB7XG4gICAgbGV0IGZpZWxkX2Vycm9ycztcbiAgICB0cnkge1xuICAgICAgYXdhaXQgc2NoZW1hLnZhbGlkYXRlKHZhbHVlcywgeyBhYm9ydEVhcmx5OiBmYWxzZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcnMpIHtcbiAgICAgIGZpZWxkX2Vycm9ycyA9IGVycm9ycy5pbm5lci5tYXAoKGVycikgPT4gKHtcbiAgICAgICAgZmllbGQ6IGVyci5wYXRoLFxuICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgIH0pKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpZWxkX2Vycm9ycztcbiAgfTtcblxuICBjb25zdCB2YWxpZGF0ZV9yb3cgPSAocm93X2lkKSA9PiB7XG4gICAgY29uc3QgdmFsdWVzID0gZ2V0X3Jvd192YWx1ZXMocm93X2lkKTtcbiAgICB2YWxpZGF0ZV92YWx1ZXModmFsdWVzKS50aGVuKCh2YWxpZCkgPT4ge1xuICAgICAgLy8gcmVtb3ZlIGFsbCBvZiB0aGUgZXJyb3JzIGluIHRoaXMgcm93IHJvdzpcbiAgICAgIE9iamVjdC5rZXlzKGZvcm1fZXJyb3JzKVxuICAgICAgICAuZmlsdGVyKChrZXkpID0+IGtleS5zdGFydHNXaXRoKHJvd19pZCkpXG4gICAgICAgIC5mb3JFYWNoKChrZXkpID0+IGRlbGV0ZSBmb3JtX2Vycm9yc1trZXldKTtcbiAgICAgIC8vIGFkIGFueSBiYWNrIGluOlxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsaWQpKSB7XG4gICAgICAgIHZhbGlkLmZvckVhY2goXG4gICAgICAgICAgKGVycikgPT4gKGZvcm1fZXJyb3JzW2Ake3Jvd19pZH0tJHtlcnIuZmllbGR9YF0gPSBbZXJyLm1lc3NhZ2VdKVxuICAgICAgICApO1xuICAgICAgICAvL2FkZF9yb3dfZXJyb3Iocm93X2lkKTtcbiAgICAgICAgJChgIyR7cm93X2lkfS1pY29uYCkuYXR0cihcImNsYXNzXCIsIFwicmVkIGFycm93IHJpZ2h0IGljb25cIik7XG4gICAgICAgICQoYCMke3Jvd19pZH0tcm93YCkuYWRkQ2xhc3MoXCJlcnJvclwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG5vIGVycm9yc1xuICAgICAgICAvL2NsZWFyX3Jvd19lcnJvcihyb3dfaWQpO1xuICAgICAgICAkKGAjJHtyb3dfaWR9LWljb25gKS5hdHRyKFwiY2xhc3NcIiwgXCJncmVlbiBjaGVjayBpY29uXCIpO1xuICAgICAgICAkKGAjJHtyb3dfaWR9LXJvd2ApLnJlbW92ZUNsYXNzKFwiZXJyb3JcIik7XG4gICAgICB9XG4gICAgICBjbGVhcl9yb3dfZmllbGRfZXJyb3JzKHJvd19pZCk7XG4gICAgICByZW5kZXJfZmllbGRfZXJyb3JzKGZvcm1fZXJyb3JzKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLz09PT09PT09PT09PT09PT09PVxuICAvLyAgICBPTiBMT0FEXG5cbiAgLy8gYXR0YWNoIG91ciByb3cgdmFsaWRhdGUgdG8gdGhlIGJsdXIgZXZlbnQgb2YgZXZlcnkgaW5wdXQgZmllbGRcbiAgJChcIiN1cGxvYWQtZm9ybSA6aW5wdXRcIikuYmx1cihmdW5jdGlvbiAoZSkge1xuICAgIGNvbnN0IGZvcm1faWRfcmVnZXggPSAvaWRfZm9ybS1bMC05XSsvO1xuICAgIGNvbnN0IHJvd19wcmVmaXggPSBlLnRhcmdldC5pZC5tYXRjaChmb3JtX2lkX3JlZ2V4KVswXTtcbiAgICB2YWxpZGF0ZV9yb3cocm93X3ByZWZpeCk7XG4gIH0pO1xuXG4gICQoXCIjdXBsb2FkLWZvcm0gOmlucHV0XCIpLmNoYW5nZShmdW5jdGlvbiAoZSkge1xuICAgIGNvbnN0IGZvcm1faWRfcmVnZXggPSAvaWRfZm9ybS1bMC05XSsvO1xuICAgIGNvbnN0IHJvd19wcmVmaXggPSBlLnRhcmdldC5pZC5tYXRjaChmb3JtX2lkX3JlZ2V4KVswXTtcbiAgICB2YWxpZGF0ZV9yb3cocm93X3ByZWZpeCk7XG4gIH0pO1xuXG4gIC8vdXBkYXRlIHRoZSBtYW5nZW1lbnQgdW5pdCwgZ3JpZCwgYW5kIHN0cmFpbiBjaG9pY2VzIGZvciBlYWNoIHJvd1xuICAvL2Jhc2VkIG9uIHRoZSB2YWx1ZSBvZiB0aGVpciBwYXJlbnQgd2lkZ2V0cyBpbiB0aGUgc2FtZSByb3dcbiAgJCgnc2VsZWN0W2lkJD1cIi1zdGF0ZV9wcm92XCJdJykuZWFjaChmdW5jdGlvbiAoeCkge1xuICAgIGxldCBwYXJlbnRfaWQgPSB0aGlzLmlkO1xuICAgIGxldCBjaGlsZF9pZCA9IHBhcmVudF9pZC5yZXBsYWNlKFwic3RhdGVfcHJvdlwiLCBcInN0YXRfZGlzdFwiKTtcbiAgICB1cGRhdGVfY2hvaWNlcyhjaGlsZF9pZCwgcGFyZW50X2lkLCBzdGF0RGlzdF9jaG9pY2VzW3RoaXMudmFsdWVdKTtcbiAgfSk7XG5cbiAgJCgnc2VsZWN0W2lkJD1cIi1zdGF0X2Rpc3RcIl0nKS5lYWNoKGZ1bmN0aW9uICh4KSB7XG4gICAgbGV0IHBhcmVudF9pZCA9IHRoaXMuaWQ7XG4gICAgbGV0IGNoaWxkX2lkID0gcGFyZW50X2lkLnJlcGxhY2UoXCJzdGF0X2Rpc3RcIiwgXCJncmlkXCIpO1xuICAgIHVwZGF0ZV9jaG9pY2VzKGNoaWxkX2lkLCBwYXJlbnRfaWQsIGdyaWQxMF9jaG9pY2VzW3RoaXMudmFsdWVdKTtcbiAgfSk7XG5cbiAgLy91cGRhdGUgdGhlIHN0cmFpbiBjaG9pY2VzIGZvciBlYWNoIHJvdyBiYXNlZCBvbiB0aGUgdmFsdWUgaW4gZWFjaCBzcGVjaWVzXG4gIC8vIGxvb3Agb3ZlciBlYWNoIG9uZSwgZ2V0IGVhY2ggaWQsIGJ1aWxkIHRoZSBzdHJhaW4gaWQsIGFuZCBzZWxlY3QgdGhlIG9wdGlvbnMgZnJvbVxuICAvLyB0aGUgc3RyYWluIGxvb2t1cDpcbiAgJCgnc2VsZWN0W2lkJD1cIi1zcGVjaWVzXCJdJykuZWFjaChmdW5jdGlvbiAoeCkge1xuICAgIGxldCBwYXJlbnRfaWQgPSB0aGlzLmlkO1xuICAgIGxldCBjaGlsZF9pZCA9IHBhcmVudF9pZC5yZXBsYWNlKFwic3BlY2llc1wiLCBcInN0cmFpblwiKTtcblxuICAgIHVwZGF0ZV9jaG9pY2VzKGNoaWxkX2lkLCBwYXJlbnRfaWQsIHN0cmFpbl9jaG9pY2VzW3RoaXMudmFsdWVdKTtcbiAgfSk7XG5cbiAgLy89PT09PT09PT09PT09PT09PT1cbiAgLy8gT04gQ0hBTkdFXG5cbiAgJCgnc2VsZWN0W2lkJD1cIi1zdGF0ZV9wcm92XCJdJykuY2hhbmdlKGZ1bmN0aW9uICh4KSB7XG4gICAgbGV0IHBhcmVudF9pZCA9IHRoaXMuaWQ7XG4gICAgbGV0IGNoaWxkX2lkID0gcGFyZW50X2lkLnJlcGxhY2UoXCJzdGF0ZV9wcm92XCIsIFwic3RhdF9kaXN0XCIpO1xuICAgIHVwZGF0ZV9jaG9pY2VzKGNoaWxkX2lkLCBwYXJlbnRfaWQsIHN0YXREaXN0X2Nob2ljZXNbdGhpcy52YWx1ZV0pO1xuICB9KTtcblxuICAkKCdzZWxlY3RbaWQkPVwiLXN0YXRfZGlzdFwiXScpLmNoYW5nZShmdW5jdGlvbiAoeCkge1xuICAgIGxldCBwYXJlbnRfaWQgPSB0aGlzLmlkO1xuICAgIGxldCBjaGlsZF9pZCA9IHBhcmVudF9pZC5yZXBsYWNlKFwic3RhdF9kaXN0XCIsIFwiZ3JpZFwiKTtcbiAgICB1cGRhdGVfY2hvaWNlcyhjaGlsZF9pZCwgcGFyZW50X2lkLCBncmlkMTBfY2hvaWNlc1t0aGlzLnZhbHVlXSk7XG4gIH0pO1xuXG4gIC8vIGlmIGEgc3BlY2llcyBjaGFuZ2VzIC0gdXBkYXRlIHRoZSBhdmFpbGFibGUgY2hvaWNlIGluIHRoZSBzdHJhaW4gY29udHJvbDpcbiAgJCgnc2VsZWN0W2lkJD1cIi1zcGVjaWVzXCJdJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgcGFyZW50X2lkID0gdGhpcy5pZDtcbiAgICBsZXQgY2hpbGRfaWQgPSBwYXJlbnRfaWQucmVwbGFjZShcInNwZWNpZXNcIiwgXCJzdHJhaW5cIik7XG4gICAgdXBkYXRlX2Nob2ljZXMoY2hpbGRfaWQsIHBhcmVudF9pZCwgc3RyYWluX2Nob2ljZXNbdGhpcy52YWx1ZV0pO1xuICB9KTtcblxuICAvLyBvbiBsb2FkLCBsb29wIG92ZXIgYWxsIG9mIHRoZSByb3dzLCB2YWxpZGF0ZSB0aGUgZGF0YSBhbmQgdXBkYXRlIHRoZSBmb3JtIGVycm9ycyBkaWN0aW9uYXJ5XG4gIC8vIHRoZW4gdXBkYXRlIHRoZSBkaXNwbGF5IHRvIHNob3cgdGhlIGVycm9ycy5cblxuICBjb25zdCBldmVudHMgPSAkKFwiI3VwbG9hZC1mb3JtIHRib2R5IHRyXCIpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICQodGhpcykuYXR0cihcImlkXCIpLnJlcGxhY2UoXCItcm93XCIsIFwiXCIpO1xuICB9KTtcblxuICBldmVudHMuZ2V0KCkuZm9yRWFjaCgocm93X2lkKSA9PiB7XG4gICAgdmFsaWRhdGVfcm93KHJvd19pZCk7XG4gIH0pO1xuXG4gIC8vIHdlIHdpbGwgbmVlZCBmdWNudGlvbnMgdG86XG4gIC8vIG1hbmFnZSBmb3JtX2Vycm9yczpcbiAgLy8gKyBhZGQgZmllbGRcbiAgLy8gKyByZW1vdmUgZmllbGRcbiAgLy8gZGVsZXRlIGlmIGFycmF5IGlzIG51bGxcbn0pO1xuIl0sIm5hbWVzIjpbImFycmF5TGlrZVRvQXJyYXkiLCJhcnJheVdpdGhvdXRIb2xlcyIsIml0ZXJhYmxlVG9BcnJheSIsInVuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5Iiwibm9uSXRlcmFibGVTcHJlYWQiLCJhcnJheVdpdGhIb2xlcyIsIml0ZXJhYmxlVG9BcnJheUxpbWl0Iiwibm9uSXRlcmFibGVSZXN0IiwidW5kZWZpbmVkIiwicmVxdWlyZSQkMCIsImdldCIsInNldCIsIk1hcCIsIm1hcCIsIlNldCIsInRvU3RyaW5nIiwic3ltYm9sVG9TdHJpbmciLCJhcnJheSIsIm9iamVjdFByb3RvIiwiaGFzT3duUHJvcGVydHkiLCJnbG9iYWwiLCJmcmVlR2xvYmFsIiwiU3ltYm9sIiwicm9vdCIsIm5hdGl2ZU9iamVjdFRvU3RyaW5nIiwic3ltVG9TdHJpbmdUYWciLCJnZXRSYXdUYWciLCJvYmplY3RUb1N0cmluZyIsInN5bWJvbFRhZyIsImlzT2JqZWN0TGlrZSIsImJhc2VHZXRUYWciLCJpc0FycmF5IiwiaXNTeW1ib2wiLCJpc09iamVjdCIsImZ1bmNUYWciLCJjb3JlSnNEYXRhIiwiZnVuY1Byb3RvIiwiZnVuY1RvU3RyaW5nIiwiaXNNYXNrZWQiLCJpc0Z1bmN0aW9uIiwidG9Tb3VyY2UiLCJnZXRWYWx1ZSIsImJhc2VJc05hdGl2ZSIsImdldE5hdGl2ZSIsIm5hdGl2ZUNyZWF0ZSIsIkhBU0hfVU5ERUZJTkVEIiwiaGFzaENsZWFyIiwiaGFzaERlbGV0ZSIsImhhc2hHZXQiLCJoYXNoSGFzIiwiaGFzaFNldCIsImVxIiwiYXNzb2NJbmRleE9mIiwibGlzdENhY2hlQ2xlYXIiLCJsaXN0Q2FjaGVEZWxldGUiLCJsaXN0Q2FjaGVHZXQiLCJsaXN0Q2FjaGVIYXMiLCJsaXN0Q2FjaGVTZXQiLCJIYXNoIiwiTGlzdENhY2hlIiwiaXNLZXlhYmxlIiwiZ2V0TWFwRGF0YSIsIm1hcENhY2hlQ2xlYXIiLCJtYXBDYWNoZURlbGV0ZSIsIm1hcENhY2hlR2V0IiwibWFwQ2FjaGVIYXMiLCJtYXBDYWNoZVNldCIsIk1hcENhY2hlIiwibWVtb2l6ZSIsIm1lbW9pemVDYXBwZWQiLCJJTkZJTklUWSIsInN5bWJvbFByb3RvIiwiYXJyYXlNYXAiLCJiYXNlVG9TdHJpbmciLCJpc0tleSIsInN0cmluZ1RvUGF0aCIsImFyZ3NUYWciLCJwcm9wZXJ0eUlzRW51bWVyYWJsZSIsImJhc2VJc0FyZ3VtZW50cyIsIk1BWF9TQUZFX0lOVEVHRVIiLCJjYXN0UGF0aCIsInRvS2V5IiwiaXNMZW5ndGgiLCJpc0luZGV4IiwiaXNBcmd1bWVudHMiLCJoYXNQYXRoIiwiYmFzZUhhcyIsImhhcyIsIl9leHRlbmRzIiwiZGVmaW5lUHJvcGVydHkiLCJjcmVhdGVCYXNlRm9yIiwic3R1YkZhbHNlIiwiYXJyYXlUYWciLCJib29sVGFnIiwiZGF0ZVRhZyIsImVycm9yVGFnIiwibWFwVGFnIiwibnVtYmVyVGFnIiwib2JqZWN0VGFnIiwicmVnZXhwVGFnIiwic2V0VGFnIiwic3RyaW5nVGFnIiwid2Vha01hcFRhZyIsImFycmF5QnVmZmVyVGFnIiwiZGF0YVZpZXdUYWciLCJub2RlVXRpbCIsImJhc2VVbmFyeSIsImJhc2VJc1R5cGVkQXJyYXkiLCJpc0J1ZmZlciIsImlzVHlwZWRBcnJheSIsImJhc2VUaW1lcyIsIm92ZXJBcmciLCJpc1Byb3RvdHlwZSIsIm5hdGl2ZUtleXMiLCJpc0FycmF5TGlrZSIsImFycmF5TGlrZUtleXMiLCJiYXNlS2V5cyIsImJhc2VGb3IiLCJrZXlzIiwic3RhY2tDbGVhciIsInN0YWNrRGVsZXRlIiwic3RhY2tHZXQiLCJzdGFja0hhcyIsInN0YWNrU2V0Iiwic2V0Q2FjaGVBZGQiLCJzZXRDYWNoZUhhcyIsIkNPTVBBUkVfUEFSVElBTF9GTEFHIiwiQ09NUEFSRV9VTk9SREVSRURfRkxBRyIsIlNldENhY2hlIiwiYXJyYXlTb21lIiwiY2FjaGVIYXMiLCJVaW50OEFycmF5IiwibWFwVG9BcnJheSIsInNldFRvQXJyYXkiLCJlcXVhbEFycmF5cyIsImFycmF5UHVzaCIsInN0dWJBcnJheSIsImFycmF5RmlsdGVyIiwiYmFzZUdldEFsbEtleXMiLCJnZXRTeW1ib2xzIiwiZ2V0QWxsS2V5cyIsIlByb21pc2UiLCJEYXRhVmlldyIsIldlYWtNYXAiLCJnZXRUYWciLCJTdGFjayIsImVxdWFsQnlUYWciLCJlcXVhbE9iamVjdHMiLCJiYXNlSXNFcXVhbERlZXAiLCJiYXNlSXNFcXVhbCIsImlzU3RyaWN0Q29tcGFyYWJsZSIsImdldE1hdGNoRGF0YSIsIm1hdGNoZXNTdHJpY3RDb21wYXJhYmxlIiwiYmFzZUlzTWF0Y2giLCJiYXNlR2V0IiwiYmFzZUhhc0luIiwiaGFzSW4iLCJiYXNlUHJvcGVydHkiLCJiYXNlUHJvcGVydHlEZWVwIiwiaWRlbnRpdHkiLCJiYXNlTWF0Y2hlc1Byb3BlcnR5IiwiYmFzZU1hdGNoZXMiLCJwcm9wZXJ0eSIsImJhc2VJdGVyYXRlZSIsImJhc2VGb3JPd24iLCJiYXNlQXNzaWduVmFsdWUiLCJnZXR0ZXIiLCJSZWYiLCJtYXBWYWx1ZXMiLCJmb3JFYWNoIiwibG9jYWxlIiwiY2xvbmVEZWVwIiwiY3JlYXRlIiwiaXNOYU4iLCJiYXNlUHJvcGVydHlPZiIsInJzQ29tYm9NYXJrc1JhbmdlIiwicmVDb21ib0hhbGZNYXJrc1JhbmdlIiwicnNDb21ib1N5bWJvbHNSYW5nZSIsInJzQ29tYm9SYW5nZSIsInJzQ29tYm8iLCJkZWJ1cnJMZXR0ZXIiLCJyc0FzdHJhbFJhbmdlIiwicnNWYXJSYW5nZSIsInJzQXBvcyIsInJzRml0eiIsInJzTW9kaWZpZXIiLCJyc05vbkFzdHJhbCIsInJzUmVnaW9uYWwiLCJyc1N1cnJQYWlyIiwicnNaV0oiLCJyZU9wdE1vZCIsInJzT3B0VmFyIiwicnNPcHRKb2luIiwicnNTZXEiLCJoYXNVbmljb2RlV29yZCIsInVuaWNvZGVXb3JkcyIsImFzY2lpV29yZHMiLCJhcnJheVJlZHVjZSIsIndvcmRzIiwiZGVidXJyIiwiY3JlYXRlQ29tcG91bmRlciIsImJhc2VTbGljZSIsImhhc1VuaWNvZGUiLCJ1bmljb2RlVG9BcnJheSIsImFzY2lpVG9BcnJheSIsInN0cmluZ1RvQXJyYXkiLCJjYXN0U2xpY2UiLCJjcmVhdGVDYXNlRmlyc3QiLCJ1cHBlckZpcnN0IiwiY2FwaXRhbGl6ZSIsInNwbGl0IiwidG9wb3NvcnQiLCJtYXBLZXlzIiwiY2FtZWxDYXNlIiwic25ha2VDYXNlIiwibWFrZV9jaG9pY2VzIiwidmFsdWVzIiwiY2hvaWNlcyIsInJlZHVjZSIsImFjYyIsIngiLCJrZXkiLCJ2YWwiLCJ1cGRhdGVfY2hvaWNlcyIsInNlbGVjdG9ySUQiLCJwYXJlbnRJRCIsIm5ld09wdGlvbnMiLCJlbCIsIiQiLCJwcmV2aW91c19zZWxlY3Rpb24iLCJwcmV2aW91c190ZXh0IiwidGV4dCIsInByZXZpb3VzX3ZhbHVlIiwiZW1wdHkiLCJ3YXNfcHJldmlvdXMiLCJmaWx0ZXIiLCJ2YWx1ZSIsImxlbmd0aCIsImFwcGVuZCIsImVhY2giLCJpIiwiaXRlbSIsImZpbmQiLCJhdHRyIiwiaXNWYWxpZERhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJkIiwiRGF0ZSIsIm5vdyIsImdldEZ1bGxZZWFyIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwicmVuZGVyX2ZpZWxkX2Vycm9ycyIsImZvcm1fZXJyb3JzIiwiT2JqZWN0IiwiZW50cmllcyIsImZsZCIsImVyciIsInNlbGVjdG9yIiwiYWRkQ2xhc3MiLCJlcnJvcl9jb3VudCIsInByb3AiLCJyZW1vdmVDbGFzcyIsImh0bWwiLCJnZXRfY2hvaWNlcyIsImZpZWxkX25hbWUiLCJzZWxlY3QiLCJjbGVhcl9yb3dfZmllbGRfZXJyb3JzIiwicm93X3ByZWZpeCIsInBhcmVudHMiLCJyZW1vdmVBdHRyIiwicmVtb3ZlIiwiZ2V0X3Jvd192YWx1ZXMiLCJyb3dfc2VsZWN0b3IiLCJyb3ciLCJyZXBsYWNlIiwibGF0aXR1ZGUiLCJsb25naXR1ZGUiLCJ3ZWlnaHQiLCJzdGF0ZXByb3ZfY2hvaWNlcyIsInN0YXREaXN0X2Nob2ljZXMiLCJncmlkMTBfY2hvaWNlcyIsInNwZWNpZXNfY2hvaWNlcyIsInN0cmFpbl9jaG9pY2VzIiwiY2xpcGNvZGVfY2hvaWNlcyIsImxpZmVzdGFnZV9jaG9pY2VzIiwic3RvY2tpbmdfbWV0aG9kX2Nob2ljZXMiLCJhbGwiLCJqc29uIiwidGhlbiIsInN0b2NraW5nIiwiY29tbW9uIiwianVyaXNkaWN0aW9ucyIsImxha2UiLCJhYmJyZXYiLCJzdGF0ZXByb3YiLCJuYW1lIiwibWFuVW5pdHMiLCJqdXJpc2RpY3Rpb24iLCJsYWJlbCIsIm11X2dyaWRzIiwiYWN0aXZlIiwiY2xpcF9jb2RlIiwic3RrX21ldGgiLCJyYXdfc3RyYWlucyIsInNwZWNpZXNfX2FiYnJldiIsInJhd19zdHJhaW4iLCJjb25kaXRpb25fY2hvaWNlcyIsInBoeXNjaGVtX21hcmtfY2hvaWNlcyIsInRhZ190eXBlX2Nob2ljZXMiLCJoYXRjaGVyeV9jaG9pY2VzIiwibGFrZV9iYm94IiwibWluTG9uIiwibWluTGF0IiwibWF4TG9uIiwibWF4TGF0IiwiY3d0X3JlZ2V4IiwidGhpc1llYXIiLCJzY2hlbWEiLCJvYmplY3QiLCJzaGFwZSIsInN0YXRlX3Byb3YiLCJzdHJpbmciLCJyZXF1aXJlZCIsIm9uZU9mIiwibnVtYmVyIiwicG9zaXRpdmUiLCJtaW4iLCJtYXgiLCJudWxsYWJsZSIsIndoZW4iLCJpcyIsIm90aGVyd2lzZSIsInRlc3QiLCJjb250ZXh0IiwicGFyZW50Iiwic2l0ZSIsInN0X3NpdGUiLCJ0cmFuc2Zvcm0iLCJfIiwidG9GaXhlZCIsInN0YXRfZGlzdCIsImlzVmFsaWQiLCJncmlkIiwic3BlY2llcyIsInN0cmFpbiIsIm5vX3N0b2NrZWQiLCJpbnRlZ2VyIiwieWVhcl9jbGFzcyIsInN0YWdlIiwiYWdlbW9udGgiLCJ0YWdfbm8iLCJtYXRjaGVzIiwiZXhjbHVkZUVtcHR5U3RyaW5nIiwibWVzc2FnZSIsInRhZ19yZXQiLCJ0eXBlRXJyb3IiLCJvcmlnaW5hbFZhbHVlIiwiU3RyaW5nIiwidHJpbSIsImNvbmRpdGlvbiIsImxvdF9jb2RlIiwic3RvY2tfbWV0aCIsIm5vdGVzIiwiaGF0Y2hlcnkiLCJhZ2VuY3lfc3RvY2tfaWQiLCJmaW5jbGlwIiwiY2xpcF9lZmZpY2llbmN5IiwicGh5c2NoZW1fbWFyayIsInRhZ190eXBlIiwidmFsaWRhdGVfdmFsdWVzIiwidmFsaWRhdGUiLCJhYm9ydEVhcmx5IiwiZmllbGRfZXJyb3JzIiwiaW5uZXIiLCJmaWVsZCIsInBhdGgiLCJ2YWxpZGF0ZV9yb3ciLCJyb3dfaWQiLCJ2YWxpZCIsInN0YXJ0c1dpdGgiLCJBcnJheSIsImJsdXIiLCJlIiwiZm9ybV9pZF9yZWdleCIsInRhcmdldCIsImlkIiwibWF0Y2giLCJjaGFuZ2UiLCJwYXJlbnRfaWQiLCJjaGlsZF9pZCIsImV2ZW50cyJdLCJtYXBwaW5ncyI6Ijs7O0VBQUEsU0FBUyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7RUFDM0UsRUFBRSxJQUFJO0VBQ04sSUFBSSxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDN0IsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0VBQzNCLEdBQUcsQ0FBQyxPQUFPLEtBQUssRUFBRTtFQUNsQixJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUNsQixJQUFJLE9BQU87RUFDWCxHQUFHO0FBQ0g7RUFDQSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtFQUNqQixJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztFQUNuQixHQUFHLE1BQU07RUFDVCxJQUFJLE9BQU8s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TSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUMxSCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQyxDQUFDO0VBQy9FLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0VBQ3pGLEdBQUc7RUFDSCxFQUFFLEtBQUssRUFBRSxTQUFTLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFO0VBQ3BDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLENBQUM7RUFDL0UsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFL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QUUsSUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUUsRUFBRSxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsT0FBTyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBT0EsVUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsRUFBRTtBQUM3VDtFQUNBLFNBQVMsNkJBQTZCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFLElBQUksTUFBTSxJQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxNQUFNLENBQUMsRUFBRTtFQUtwUyxTQUFTLGdCQUFnQixDQUFDLE1BQU0sRUFBRTtFQUNqRCxFQUFFLFNBQVMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUU7RUFDOUIsSUFBSSxJQUFJO0VBQ1IsTUFBTSxLQUFLO0VBQ1gsTUFB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QUcsR0FBRyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQy9FLEVBQUUsTUFBTSxFQUFFLEdBQUcsR0FBRyxNQUFNLEVBQUUsR0FBRztFQUMzQixFQUFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsTUFBTSxFQUFFLEdBQUc7RUFDM0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNyRCxFQUFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ3JELEVBQUUsTUFBTSxFQUFFLEdBQUcsR0FBRyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDckQsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNyRCxFQUFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsTUFBTSxFQUFFLEdBQUc7RUFDM0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDL0UsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUc7RUFDL0UsRUFBRSxNQUFNLEVBQUUsR0FBRyxHQUFHLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRztFQUNyRCxFQUFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ3JELEVBQUUsTUFBTSxFQUFFLEdBQUcsR0FBRyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHO0VBQ3hDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSTtFQUM1QixFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUk7RUFDNUIsRUFBRSxNQUFNLEVBQUUsSUFBSTtFQUNkO0VBQ0EsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDOUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDOUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM3RCxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHO0VBQzdELEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDN0QsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHO0VBQzVFLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM1RSxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHO0VBQzdELEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDN0QsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM3RCxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDNUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHO0VBQzVFLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRztFQUMvQixFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM5QyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDNUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHO0VBQzVFLEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDN0QsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM3RCxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM5QyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM5QyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM5QyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRztFQUM5QyxFQUFFLFFBQVEsRUFBRSxHQUFHLEdBQUcsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHO0VBQzdELEVBQUUsUUFBUSxFQUFFLEdBQUcsR0FBRyxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDN0QsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDOUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDOUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDM0YsRUFBRSxRQUFRLEVBQUUsR0FBRyxHQUFHLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEdBQUc7RUFDM0YsRUFBRSxRQUFR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LENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDM0Q7RUFDQSxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtFQUN6QixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0VBQzdELE1BQU0sSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN6RSxNQUFNLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7RUFDN0QsS0FBSztBQUNMO0VBQ0EsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0VBQzFELElBQUksT0FBTyxJQUFJLENBQUM7RUFDaEIsR0FBRztBQUNIO0VBQ0EsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFO0VBQ2IsSUFBSSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDdEI7RUFDQSxJQUFJLEtBQUssTUFBTSxHQUFHLElBQUksSUFBSSxFQUFFO0VBQzVCLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQzNELEtBQUs7QUFDTDtFQUNBLElBQUksT0FBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSTtFQUM3QyxNQUFNLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0VBQ3ZCLE1B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
