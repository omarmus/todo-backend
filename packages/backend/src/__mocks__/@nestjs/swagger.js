const noop = () => () => {};
const noopDecorator = () => {};

module.exports = {
  ApiTags: noop,
  ApiBearerAuth: noop,
  ApiOperation: noop,
  ApiResponse: noop,
  ApiOkResponse: noop,
  ApiCreatedResponse: noop,
  ApiBadRequestResponse: noop,
  ApiParam: noop,
  ApiProperty: noop,
  ApiPropertyOptional: noop,
  ApiBody: noop,
  ApiUnauthorizedResponse: noop,
  ApiNotFoundResponse: noop,
  SwaggerModule: { createDocument: jest.fn(), setup: jest.fn() },
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  })),
};
