import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Como en Casa API Documentation",
      version: "1.0.0",
      description: `
        Documentación oficial de la API de Como en Casa.
        
        ## Autenticación
        La API utiliza múltiples capas de seguridad:
        - 🔐 **OAuth 2.0 con Google** para el login inicial
        - 🎫 **JWT** para autorización de requests (válido por 5 minutos)
        - 🔄 **Refresh Token** en cookies httpOnly (válido por 7 días)
        
        ### Flujo de Autenticación:
        1. El usuario inicia el flujo OAuth con Google
        2. Después del login exitoso, se genera un JWT y un refresh token
        3. El JWT se usa en el header Authorization: \`Bearer <token>\`
        4. El refresh token se almacena automáticamente en una cookie segura
        5. Cuando el JWT expira, usar /api/auth/refresh para obtener uno nuevo

        ## Características Adicionales
        - 📦 **Gestión de Productos y Categorías**
        - 🛒 **Sistema de Pedidos**
        - 👥 **Gestión de Clientes**
        - 💰 **Reportes Financieros**
        - 🚚 **Control de Delivery**
      `,
      contact: {
        name: "Soporte Como en Casa",
        email: "soporte@comoencasa.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desarrollo",
      },
      {
        url: "https://api.comoencasa.com",
        description: "Servidor de Producción",
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Endpoints de autenticación y autorización con Google OAuth 2.0",
      },
      {
        name: "Products",
        description: "Gestión de productos y categorías",
      },
      {
        name: "Orders",
        description: "Gestión de pedidos",
      },
      {
        name: "Clients",
        description: "Gestión de clientes",
      },
      {
        name: "Finances",
        description: "Reportes financieros",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Ingresa tu JWT token",
        },
        GoogleAuth: {
          type: "oauth2",
          flows: {
            implicit: {
              authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
              scopes: {
                "profile email": "Ver perfil y email",
              },
            },
          },
        },
      },
      schemas: {
        // Auth Schemas
        AuthResponse: {
          type: "object",
          properties: {
            accessToken: {
              type: "string",
              description: "JWT token para autenticación",
            },
            user: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "Email del usuario",
                },
                name: {
                  type: "string",
                  description: "Nombre completo del usuario",
                },
                avatar: {
                  type: "string",
                  description: "URL del avatar del usuario",
                },
                role: {
                  type: "string",
                  enum: ["admin", "user"],
                  description: "Rol del usuario",
                },
              },
            },
          },
        },

        // Product Schemas
        Product: {
          type: "object",
          required: ["nombre", "categoria_id", "precio"],
          properties: {
            id: {
              type: "integer",
              description: "ID único del producto",
              example: 1
            },
            nombre: {
              type: "string",
              description: "Nombre del producto",
              example: "Empanada de Carne"
            },
            categoria_id: {
              type: "integer",
              description: "ID de la categoría",
              example: 1
            },
            precio: {
              type: "number",
              description: "Precio del producto",
              example: 300.50
            },
            disponible: {
              type: "boolean",
              description: "Disponibilidad del producto",
              default: true
            }
          },
        },

        Category: {
          type: "object",
          required: ["nombre"],
          properties: {
            id: {
              type: "integer",
              description: "ID único de la categoría",
              example: 1
            },
            nombre: {
              type: "string",
              description: "Nombre de la categoría",
              example: "Empanadas"
            },
            productos: {
              type: "array",
              description: "Lista de productos en esta categoría",
              items: {
                $ref: "#/components/schemas/Product"
              }
            }
          },
        },

        // Order Schemas
        Order: {
          type: "object",
          required: ["cliente_id", "productos", "domicilio"],
          properties: {
            id: {
              type: "integer",
              description: "ID único del pedido",
              example: 1
            },
            cliente_id: {
              type: "integer",
              description: "ID del cliente",
              example: 1
            },
            estado: {
              type: "string",
              enum: ["pendiente", "preparando", "enviando", "entregado", "cancelado"],
              description: "Estado del pedido",
              example: "preparando"
            },
            domicilio: {
              type: "string",
              description: "Dirección de entrega",
              example: "Av. Siempre Viva 123"
            },
            hora_entrega: {
              type: "string",
              format: "time",
              description: "Hora estimada de entrega",
              example: "18:30"
            },
            productos: {
              type: "array",
              description: "Lista de productos en el pedido",
              items: {
                $ref: "#/components/schemas/OrderProduct"
              }
            },
            monto_total: {
              type: "number",
              description: "Monto total del pedido",
              example: 2500.50
            },
            metodo_pago: {
              type: "string",
              enum: ["efectivo", "transferencia"],
              description: "Método de pago",
              example: "efectivo"
            },
            fecha_pedido: {
              type: "string",
              format: "date-time",
              description: "Fecha y hora del pedido",
              example: "2025-10-04T15:30:00Z"
            },
            fecha_pago: {
              type: "string",
              format: "date-time",
              description: "Fecha y hora del pago",
              nullable: true
            },
            observaciones: {
              type: "string",
              description: "Observaciones adicionales",
              nullable: true,
              example: "Sin cebolla"
            }
          },
        },

        OrderProduct: {
          type: "object",
          required: ["producto_id", "cantidad"],
          properties: {
            producto_id: {
              type: "integer",
              description: "ID del producto",
              example: 1
            },
            cantidad: {
              type: "integer",
              description: "Cantidad del producto",
              minimum: 1,
              example: 3
            },
            precio_unitario: {
              type: "number",
              description: "Precio unitario al momento del pedido",
              example: 300.50
            },
            subtotal: {
              type: "number",
              description: "Subtotal (precio × cantidad)",
              example: 901.50
            }
          },
        },

        // Client Schemas
        Client: {
          type: "object",
          required: ["nombre", "apellido", "telefono"],
          properties: {
            id: {
              type: "integer",
              description: "ID único del cliente",
              example: 1
            },
            nombre: {
              type: "string",
              description: "Nombre del cliente",
              example: "Juan"
            },
            apellido: {
              type: "string",
              description: "Apellido del cliente",
              example: "Pérez"
            },
            telefono: {
              type: "string",
              description: "Teléfono del cliente (formato internacional)",
              example: "+5491123456789"
            },
            direcciones: {
              type: "array",
              description: "Direcciones guardadas del cliente",
              items: {
                type: "string"
              },
              example: ["Av. Siempre Viva 123", "Calle Falsa 123"]
            },
            historial_pedidos: {
              type: "array",
              description: "IDs de pedidos anteriores",
              items: {
                type: "integer"
              }
            }
          },
        },

        // Finance Schemas
        FinanceReport: {
          type: "object",
          properties: {
            periodo: {
              type: "string",
              description: "Período del reporte (hoy/mensual)",
              example: "2025-10"
            },
            total_ventas: {
              type: "number",
              description: "Monto total de ventas",
              example: 150000.75
            },
            efectivo: {
              type: "number",
              description: "Total en efectivo",
              example: 75000.25
            },
            transferencias: {
              type: "number",
              description: "Total en transferencias",
              example: 75000.50
            },
            cantidad_pedidos: {
              type: "integer",
              description: "Cantidad total de pedidos",
              example: 50
            },
            delivery: {
              type: "object",
              properties: {
                monto_cobrado: {
                  type: "number",
                  description: "Monto total cobrado por delivery",
                  example: 5000.00
                },
                monto_a_pagar: {
                  type: "number",
                  description: "Monto a pagar al servicio de delivery",
                  example: 2500.00
                }
              }
            }
          },
        },

        FinanceParams: {
          type: "object",
          required: ["delivery_fee", "min_order_amount"],
          properties: {
            delivery_fee: {
              type: "number",
              description: "Tarifa de delivery",
              example: 500.00
            },
            min_order_amount: {
              type: "number",
              description: "Monto mínimo de pedido",
              example: 3000.00
            }
          },
        },

        // Error Schemas
        Error: {
          type: "object",
          required: ["error", "statusCode"],
          properties: {
            error: {
              type: "string",
              description: "Mensaje de error",
              example: "Recurso no encontrado"
            },
            statusCode: {
              type: "integer",
              description: "Código de estado HTTP",
              example: 404
            },
            details: {
              type: "object",
              description: "Detalles adicionales del error (opcional)",
              nullable: true
            }
          },
        },

        ValidationError: {
          type: "object",
          required: ["error", "statusCode", "validationErrors"],
          properties: {
            error: {
              type: "string",
              description: "Mensaje de error general",
              example: "Error de validación"
            },
            statusCode: {
              type: "integer",
              description: "Código de estado HTTP",
              example: 400
            },
            validationErrors: {
              type: "array",
              description: "Lista de errores de validación",
              items: {
                type: "object",
                properties: {
                  field: {
                    type: "string",
                    description: "Campo que falló la validación",
                    example: "telefono"
                  },
                  message: {
                    type: "string",
                    description: "Mensaje de error específico",
                    example: "Formato de teléfono inválido"
                  }
                }
              }
            }
          },
        }
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Como en Casa API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      filter: true,
      docExpansion: "none",
    },
  };

  app.use("/api/docs", swaggerUi.serve);
  app.get("/api/docs", swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  app.get("/api/docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log("📚 Documentación Swagger disponible en /api/docs");
}