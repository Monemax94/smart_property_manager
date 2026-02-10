import { Request, Response } from 'express';

export abstract class BaseController {
  protected abstract executeImpl(req: Request, res: Response): Promise<void | any>;

  public async execute(req: Request, res: Response): Promise<void> {
    try {
      await this.executeImpl(req, res);
    } catch (err) {
      this.fail(res, 'An unexpected error occurred');
    }
  }

  protected ok<T>(res: Response, dto?: T) {
    if (dto) {
      res.type('application/json');
      return res.status(200).json(dto);
    }
    return res.sendStatus(200);
  }

  protected fail(res: Response, error: Error | string) {
    console.error(error);
    return res.status(500).json({
      message: error.toString()
    });
  }
}