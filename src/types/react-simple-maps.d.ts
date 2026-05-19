declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface Geography {
    rsmKey: string;
    properties: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface GeographiesChildrenProps {
    geographies: Geography[];
  }

  export interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    [key: string]: unknown;
  }

  export interface ComposableMapProps extends React.SVGAttributes<SVGElement> {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (props: GeographiesChildrenProps) => React.ReactNode;
  }

  export interface GeographyProps extends React.SVGAttributes<SVGPathElement> {
    geography: Geography;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
  }

  export interface MarkerProps extends React.SVGAttributes<SVGGElement> {
    coordinates: [number, number];
    children?: React.ReactNode;
  }

  export const ComposableMap: React.FC<ComposableMapProps>;
  export const Geographies: React.FC<GeographiesProps>;
  export const Geography: React.FC<GeographyProps>;
  export const Marker: React.FC<MarkerProps>;
}
