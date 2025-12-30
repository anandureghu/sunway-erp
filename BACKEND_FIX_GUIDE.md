# Backend Fix Guide: PurchaseOrderItemDTO Jackson Deserialization Error

## Problem
The frontend is sending a correctly formatted payload, but the backend Jackson deserializer cannot convert it to `PurchaseOrderItemDTO`. This is a **backend configuration issue**.

## Frontend Payload (Current)
```json
{
  "supplierId": 1,
  "orderDate": "2025-12-28",
  "items": [
    {
      "itemId": 1,
      "quantity": 25,
      "unitCost": 25,
      "lineTotal": 625
    }
  ]
}
```

## Backend Issues to Check

### 1. Check DTO Field Names
The backend `PurchaseOrderItemDTO` class might expect different field names:

**Option A: Snake Case (if backend uses snake_case)**
```java
public class PurchaseOrderItemDTO {
    @JsonProperty("item_id")
    private Long itemId;
    
    @JsonProperty("unit_cost")
    private BigDecimal unitCost;
    
    @JsonProperty("line_total")
    private BigDecimal lineTotal;
    
    private Integer quantity;
}
```

**Option B: Camel Case (standard Spring Boot)**
```java
public class PurchaseOrderItemDTO {
    private Long itemId;  // Must match exactly: "itemId"
    private Integer quantity;
    private BigDecimal unitCost;  // Must match exactly: "unitCost"
    private BigDecimal lineTotal;  // Must match exactly: "lineTotal"
}
```

### 2. Check for Default Constructor
Jackson requires a no-argument constructor:

```java
public class PurchaseOrderItemDTO {
    // ... fields ...
    
    // REQUIRED: Default constructor
    public PurchaseOrderItemDTO() {
    }
    
    // All-args constructor (optional)
    public PurchaseOrderItemDTO(Long itemId, Integer quantity, BigDecimal unitCost, BigDecimal lineTotal) {
        this.itemId = itemId;
        this.quantity = quantity;
        this.unitCost = unitCost;
        this.lineTotal = lineTotal;
    }
}
```

### 3. Check Data Types
Ensure data types match:
- `itemId`: Should be `Long` (not `Integer` if IDs can be large)
- `quantity`: Should be `Integer` or `Long`
- `unitCost`: Should be `BigDecimal` (for precision)
- `lineTotal`: Should be `BigDecimal` (for precision)

### 4. Check Jackson Configuration
In `application.properties` or `application.yml`:

```properties
# Ensure Jackson is configured correctly
spring.jackson.property-naming-strategy=SNAKE_CASE
# OR
spring.jackson.property-naming-strategy=CAMEL_CASE
```

### 5. Check @JsonProperty Annotations
If using `@JsonProperty`, ensure they match the frontend payload:

```java
public class PurchaseOrderItemDTO {
    @JsonProperty("itemId")  // Must match frontend
    private Long itemId;
    
    @JsonProperty("quantity")
    private Integer quantity;
    
    @JsonProperty("unitCost")  // Must match frontend
    private BigDecimal unitCost;
    
    @JsonProperty("lineTotal")  // Must match frontend
    private BigDecimal lineTotal;
}
```

### 6. Check if lineTotal Should Be Omitted
The backend might calculate `lineTotal` automatically. Try removing it from the DTO:

```java
public class PurchaseOrderItemDTO {
    private Long itemId;
    private Integer quantity;
    private BigDecimal unitCost;
    // lineTotal calculated in service layer
}
```

## Quick Fix Steps

1. **Check the actual DTO class** in your backend:
   - File: `com.erp.dto.purchase.PurchaseOrderItemDTO`
   - Verify field names match exactly (case-sensitive)
   - Verify default constructor exists

2. **Check the controller method**:
   ```java
   @PostMapping("/purchase/orders")
   public ResponseEntity<PurchaseOrderResponseDTO> createOrder(
       @RequestBody PurchaseOrderCreateDTO dto  // Check this DTO too
   ) {
       // ...
   }
   ```

3. **Enable Jackson debug logging**:
   ```properties
   logging.level.com.fasterxml.jackson=DEBUG
   ```

4. **Test with Postman/curl** using the exact payload structure

## Expected Backend DTO Structure

Based on the API spec, the backend should accept:

```java
public class PurchaseOrderCreateDTO {
    private Long supplierId;
    private String orderDate;  // or LocalDate
    private List<PurchaseOrderItemDTO> items;
}

public class PurchaseOrderItemDTO {
    private Long itemId;
    private Integer quantity;
    private BigDecimal unitCost;
    private BigDecimal lineTotal;  // Optional - might be calculated
    
    // REQUIRED: Default constructor
    public PurchaseOrderItemDTO() {
    }
    
    // Getters and setters
    // ...
}
```

## Solution Priority

1. **Most Likely**: Field name mismatch - check `@JsonProperty` annotations
2. **Second**: Missing default constructor
3. **Third**: Data type mismatch (Integer vs Long, Double vs BigDecimal)
4. **Fourth**: Jackson configuration issue

