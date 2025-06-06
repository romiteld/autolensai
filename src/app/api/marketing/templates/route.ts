import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MarketingTemplateService } from '@/marketing/services/template.service';

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  platform: z.enum(['facebook', 'instagram', 'craigslist', 'youtube', 'universal']),
  category: z.enum(['sedan', 'suv', 'truck', 'luxury', 'sports', 'electric', 'universal']),
  template: z.object({
    title: z.string().min(1, 'Title template is required'),
    description: z.string().min(1, 'Description template is required'),
    hashtags: z.array(z.string()).optional(),
    priceFormat: z.string().optional(),
    features: z.array(z.string()).optional(),
    callToAction: z.string().optional(),
  }),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'number', 'boolean', 'select']),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    options: z.array(z.string()).optional(),
  })).optional(),
  isActive: z.boolean().default(true),
  metadata: z.object({
    author: z.string().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lastUpdated: z.string().datetime().optional(),
  }).optional(),
});

type CreateTemplateRequest = z.infer<typeof CreateTemplateSchema>;

const UpdateTemplateSchema = CreateTemplateSchema.partial().extend({
  id: z.string().uuid(),
});

type UpdateTemplateRequest = z.infer<typeof UpdateTemplateSchema>;

const templateService = new MarketingTemplateService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      ...(platform && { platform }),
      ...(category && { category }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(search && { search }),
    };

    const templates = await templateService.getTemplates({
      filters,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTemplateRequest = await request.json();
    const validatedData = CreateTemplateSchema.parse(body);

    const template = await templateService.createTemplate(validatedData);

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to create template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateTemplateRequest = await request.json();
    const validatedData = UpdateTemplateSchema.parse(body);

    const { id, ...updateData } = validatedData;
    const updatedTemplate = await templateService.updateTemplate(id, updateData);

    if (!updatedTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Failed to update template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template ID is required',
        },
        { status: 400 }
      );
    }

    const success = await templateService.deleteTemplate(templateId);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}