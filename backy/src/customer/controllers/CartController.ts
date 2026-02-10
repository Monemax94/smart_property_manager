import { inject, injectable } from 'inversify';
import { Request, Response } from 'express';
import { CartService } from '../../services/CartService';
import { AuthenticatedRequest } from '../../types/customRequest';
import { TYPES } from '../../config/types';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { ProductService } from '../../services/ProductService';
import { AddressService } from '../../services/AddressService';

@injectable()
export class CartController {
  constructor(
    @inject(TYPES.CartService) private cartService: CartService,
    @inject(TYPES.ProductService) private productService: ProductService,
    @inject(TYPES.AddressService) private addressService: AddressService
  ) { }

  getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const cart = await this.cartService.getCart(userId.toString());

    res.json(new ApiResponse(200, cart, 'Cart retrieved successfully'));
  });
  getCartSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const vendorId = req.query?.vendorId;
    const cartSummary = await this.cartService.getCartSummary(userId.toString(), vendorId?.toString());
    return res.json(ApiResponse.success(cartSummary, 'Cart retrieved successfully'));
  });

  addToCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const items = req.body;

    if (!Array.isArray(items)) {
      throw ApiError.badRequest('At least one item must be provided');
    }

    const cart = await this.cartService.addManyToCart(userId.toString(), items);

    res.json(new ApiResponse(200, { cart }, 'Items added to cart successfully'));
  });
  requestProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const requestedBy = req.user!._id;
    const { addressId, ...data } = req.body;
    // check address exits
    const address = await this.addressService.getAddressById(addressId);
    if (!address) {
      return res.status(400).json(
        ApiError.badRequest("invalid address")
      )
    }
    const product = await this.productService.requestProduct(
      { ...data, requestedBy, address: addressId }
    );
    return res.json(ApiResponse.created(product, 'Product availability request submitted successfully'));
  });

  removeFromCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const { productId } = req.params;

    const cart = await this.cartService.removeFromCart(userId.toString(), productId);

    if (!cart) {
      throw ApiError.notFound('Cart not found');
    }

    res.json(new ApiResponse(200, cart, 'Item removed from cart successfully'));
  });

  updateQuantity = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || isNaN(quantity) || quantity < 1) {
      throw ApiError.badRequest('Valid quantity (minimum 1) is required');
    }

    const cart = await this.cartService.updateItemQuantity(
      userId.toString(),
      productId,
      Number(quantity)
    );

    res.json(new ApiResponse(200, cart, 'Item quantity updated successfully'));
  });

  clearCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const cart = await this.cartService.clearCart(userId.toString());

    res.json(new ApiResponse(200, cart, 'Cart cleared successfully'));
  });

  getCartCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id;
    const count = await this.cartService.getCartCount(userId.toString());

    res.json(new ApiResponse(200, { count }, 'Cart count retrieved successfully'));
  });
}