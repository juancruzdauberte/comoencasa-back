import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Como en Casa API',
      version: '1.0.0',
      description: `
        API REST completa para la gestión de pedidos, productos, clientes y finanzas del negocio "Como en Casa".
        
        ## Características principales:
        - **Autenticación OAuth 2.0** con Google
        - **JWT Tokens** para acceso y refresh
        - **Gestión de Pedidos** (CRUD completo)
        - **Gestión de Productos y Categorías**
        - **Administración de Clientes**
        - **Reportes Financieros** detallados
        
        ## Autenticación
        La API utiliza JWT (JSON Web Tokens) para autenticación. Existen dos tipos de tokens:
        - **Access Token**: Válido por 5 minutos, se envía en el header Authorization
        - **Refresh Token**: Válido por 7 días, se almacena en cookie httpOnly
        
        Para autenticarse, usa el flujo OAuth de Google y luego incluye el access token en tus requests:
        \`\`\`
        Authorization: Bearer <tu_access_token>
        \`\`\`
      `,
      contact: {
        name: 'Soporte Como en Casa',
        email: 'soporte@comoencasa.com'
      },
      license: {
        name: 'ISC',
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://api.comoencasa.com',
        description: 'Servidor de Producción'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación y autorización con Google OAuth 2.0'
      },
      {
        name: 'Products',
        description: 'Gestión de productos y categorías'
      },
      {
        name: 'Orders',
        description: 'Gestión completa de pedidos (crear, listar, modificar, eliminar)'
      },
      {
        name: 'Clients',
        description: 'Consulta de información de clientes'
      },
      {
        name: 'Finances',
        description: 'Reportes financieros y estadísticas de ventas'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Access Token obtenido después del login con Google'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh Token almacenado en cookie httpOnly'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error descriptivo'
            },
            statusCode: {
              type: 'number',
              description: 'Código de estado HTTP'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del producto',
              example: 1
            },
            nombre: {
              type: 'string',
              description: 'Nombre del producto',
              example: 'Empanada de Carne'
            },
            categoria_id: {
              type: 'integer',
              description: 'ID de la categoría a la que pertenece',
              example: 1
            },
            categoria: {
              type: 'string',
              description: 'Nombre de la categoría',
              example: 'Empanadas'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único de la categoría',
              example: 1
            },
            nombre: {
              type: 'string',
              description: 'Nombre de la categoría',
              example: 'Empanadas'
            },
            productos: {
              type: 'array',
              description: 'Lista de productos en esta categoría',
              items: {
                $ref: '#/components/schemas/Product'
              }
            }
          }
        },
        OrderProduct: {
          type: 'object',
          required: ['producto_id', 'cantidad'],
          properties: {
            producto_id: {
              type: 'integer',
              description: 'ID del producto',
              example: 1
            },
            cantidad: {
              type: 'integer',
              minimum: 1,
              description: 'Cantidad del producto',
              example: 12
            }
          }
        },
        OrderProductDetail: {
          type: 'object',
          properties: {
            producto_id: {
              type: 'integer',
              description: 'ID del producto',
              example: 1
            },
            nombre: {
              type: 'string',
              description: 'Nombre del producto',
              example: 'Empanada de Carne'
            },
            cantidad: {
              type: 'integer',
              description: 'Cantidad en el pedido',
              example: 12
            },
            categoria: {
              type: 'string',
              description: 'Categoría del producto',
              example: 'Empanadas'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único del pedido',
              example: 1
            },
            domicilio: {
              type: 'string',
              description: 'Dirección de entrega',
              example: 'Av. Siempre Viva 123'
            },
            nombre_cliente: {
              type: 'string',
              description: 'Nombre del cliente',
              example: 'Juan'
            },
            apellido_cliente: {
              type: 'string',
              description: 'Apellido del cliente',
              example: 'Pérez'
            },
            telefono_cliente: {
              type: 'string',
              description: 'Teléfono del cliente',
              example: '+5491123456789'
            },
            fecha_pedido: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora en que se creó el pedido',
              example: '2024-01-15T14:30:00Z'
            },
            hora_entrega: {
              type: 'string',
              format: 'time',
              nullable: true,
              description: 'Hora estimada de entrega',
              example: '18:30'
            },
            estado: {
              type: 'string',
              enum: ['preparando', 'listo', 'entregado', 'cancelado'],
              description: 'Estado actual del pedido',
              example: 'preparando'
            },
            monto_pago: {
              type: 'number',
              format: 'float',
              nullable: true,
              description: 'Monto total del pedido',
              example: 5400.50
            },
            fecha_pago: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Fecha en que se pagó el pedido',
              example: '2024-01-15T19:00:00Z'
            },
            metodo_pago: {
              type: 'string',
              enum: ['efectivo', 'transferencia'],
              nullable: true,
              description: 'Método de pago utilizado',
              example: 'transferencia'
            },
            observacion: {
              type: 'string',
              nullable: true,
              description: 'Observaciones o comentarios adicionales',
              example: 'Sin cebolla'
            },
            productos: {
              type: 'array',
              description: 'Lista de productos en el pedido',
              items: {
                $ref: '#/components/schemas/OrderProductDetail'
              }
            }
          }
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['nombre_cliente', 'apellido_cliente', 'telefono_cliente', 'domicilio', 'productos'],
          properties: {
            nombre_cliente: {
              type: 'string',
              description: 'Nombre del cliente',
              example: 'Juan'
            },
            apellido_cliente: {
              type: 'string',
              description: 'Apellido del cliente',
              example: 'Pérez'
            },
            telefono_cliente: {
              type: 'string',
              description: 'Teléfono del cliente (formato internacional)',
              example: '+5491123456789'
            },
            domicilio: {
              type: 'string',
              description: 'Dirección de entrega',
              example: 'Av. Siempre Viva 123'
            },
            hora_entrega: {
              type: 'string',
              format: 'time',
              description: 'Hora estimada de entrega (HH:MM)',
              example: '18:30'
            },
            observacion: {
              type: 'string',
              description: 'Observaciones adicionales',
              example: 'Sin cebolla'
            },
            metodo_pago: {
              type: 'string',
              enum: ['efectivo', 'transferencia'],
              description: 'Método de pago',
              example: 'transferencia'
            },
            monto: {
              type: 'number',
              format: 'float',
              description: 'Monto total del pedido',
              example: 5400.50
            },
            productos: {
              type: 'array',
              description: 'Lista de productos para el pedido',
              items: {
                $ref: '#/components/schemas/OrderProduct'
              }
            }
          }
        },
        Client: {
          type: 'object',
          properties: {
            nombre: {
              type: 'string',
              description: 'Nombre del cliente',
              example: 'Juan'
            },
            apellido: {
              type: 'string',
              description: 'Apellido del cliente',
              example: 'Pérez'
            }
          }
        },
        FinanceAmount: {
          type: 'object',
          properties: {
            monto: {
              type: 'number',
              format: 'float',
              description: 'Monto total',
              example: 125450.75
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso inválido, expirado o no proporcionado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Token no válido',
                statusCode: 401
              }
            }
          }
        },
        ForbiddenError: {
          description: 'No tienes permisos suficientes para acceder a este recurso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Acceso denegado',
                statusCode: 403
              }
            }
          }
        },
        NotFoundError: {
          description: 'El recurso solicitado no fue encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Recurso no encontrado',
                statusCode: 404
              }
            }
          }
        },
        BadRequestError: {
          description: 'La solicitud contiene datos inválidos o incompletos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Datos inválidos',
                statusCode: 400
              }
            }
          }
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Error interno del servidor',
                statusCode: 500
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Como en Casa API Docs',
  }));

  // JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger docs available at /api/docs');
}
