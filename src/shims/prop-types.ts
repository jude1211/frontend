// Minimal no-op shim for prop-types to satisfy legacy libs in dev
const PropTypes: Record<string, any> = new Proxy({}, {
  get: () => () => null,
});

export default PropTypes;

