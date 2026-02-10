import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { CarouselService } from '../services/CarouselService';

@injectable()
export class CarouselController {
  constructor(
    @inject(TYPES.CarouselService) private carouselService: CarouselService,
  ) { }

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, subtitle, buttonText, buttonLink, position, backgroundColor } = req.body;

    const userId = req.user._id;
    const uploadedFilex = req.body.uploadedFiles || [];


    const banner = await this.carouselService.createBanner({
      title,
      subtitle,
      buttonText,
      buttonLink,
      backgroundColor,
      image: uploadedFilex,
      position
    });
    res.status(201).json(new ApiResponse(201, banner, 'Banner created successfully'));
  });

  getAll = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const banners = await this.carouselService.getAllBanners();
    return res.json(ApiResponse.success(banners, 'banner retrieved successfully'));
  });

   /**
   * Get only active banners (for homepage carousel)
   */
   getActive = asyncHandler(async (_: Request, res: Response) => {
    const banners = await this.carouselService.getActiveBanners();
    return res.json(new ApiResponse(200, banners, 'banner retrieved successfully'));
  })


  /**
 * Update banner
 */
  update = asyncHandler(async (req: Request, res: Response) => {
    const bannerId = req.params.id
    const { uploadedFiles, ...data } = req.body;
    const userId = req.user._id;
    const uploadedFilex = req.body.uploadedFiles || [];
    
    const result = await this.carouselService.updateBanner(
      bannerId, 
      { ...data, image: uploadedFilex }
    );
    return res.json(ApiResponse.success(result, 'Banner updated successfully'));
  })

  /**
  * Delete banner
  */
  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.carouselService.deleteBanner(req.params.id);
    return res.json(ApiResponse.success({}, 'Banner Updates'));
  })
}