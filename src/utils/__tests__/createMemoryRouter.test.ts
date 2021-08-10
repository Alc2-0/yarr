import { createMemoryHistory } from 'history';
import { createMemoryRouter } from '../createMemoryRouter';
import { createRouter } from '../createRouter';

jest.mock('history', () => ({
  createMemoryHistory: jest.fn(() => 'MemoryHistory'),
}));
jest.mock('../createRouter');

describe('createMemoryRouter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws when called with no arguments', () => {
    expect(() => {
      // @ts-expect-error - Verifying throw of invalid arguments.
      createMemoryRouter();
    }).toThrow();
  });

  it('calls createMemoryHistory with history options, and createRouter with routes and history', () => {
    const routes = [{}, {}];
    createMemoryRouter(routes, { initialEntries: ['/'], initialIndex: 0 });

    expect(createMemoryHistory).toHaveBeenCalledTimes(1);
    expect(createMemoryHistory).toHaveBeenCalledWith({
      initialEntries: ['/'],
      initialIndex: 0,
    });
    expect(createRouter).toHaveBeenCalledTimes(1);
    expect(createRouter).toHaveBeenCalledWith({
      history: 'MemoryHistory',
      routes,
    });
  });
});
