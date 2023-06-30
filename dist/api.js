import { _ as _asyncToGenerator, a as _regeneratorRuntime, v as validateSpecAndMockContent } from './swagger-mock-validator-89accd71.js';
import 'assert';
import 'stream';
import 'util';
import 'querystring';
import 'url';
import 'fs';
import 'http';
import 'https';

var swaggerMockValidator = {
  validate: function () {
    var _validate = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(options) {
      var result;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return validateSpecAndMockContent(options);
          case 2:
            result = _context.sent;
            return _context.abrupt("return", result.validationOutcome);
          case 4:
          case "end":
            return _context.stop();
        }
      }, _callee);
    }));
    function validate(_x) {
      return _validate.apply(this, arguments);
    }
    return validate;
  }()
};

export { swaggerMockValidator as default };
//# sourceMappingURL=api.js.map
