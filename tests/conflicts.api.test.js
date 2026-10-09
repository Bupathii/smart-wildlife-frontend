import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

const {
  apiClientMock,
} =
  vi.hoisted(
    () => ({
      apiClientMock: {
        get:
          vi.fn(),

        patch:
          vi.fn(),

        delete:
          vi.fn(),
      },
    })
  );

vi.mock(
  '../src/api/client',
  () => ({
    default:
      apiClientMock,
  })
);

import {
  archiveConflictReport,
  getAdminConflictReportById,
  getArchivedConflictReports,
  getConflictAnalyticsReports,
  getConflictReportById,
  getConflictReports,
  permanentlyDeleteConflictReport,
  restoreConflictReport,
  updateConflictResponse,
} from '../src/api/conflicts';

describe(
  'web conflict API service',
  () => {
    beforeEach(() => {
      apiClientMock
        .get
        .mockReset();

      apiClientMock
        .patch
        .mockReset();

      apiClientMock
        .delete
        .mockReset();
    });

    test(
      'loads active conflict reports with default pagination',
      async () => {
        const data = {
          reports: [],

          pagination: {
            page: 1,
            limit: 10,

            totalReports:
              0,

            totalPages:
              0,
          },
        };

        apiClientMock
          .get
          .mockResolvedValue({
            data,
          });

        await expect(
          getConflictReports()
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.get
        ).toHaveBeenCalledWith(
          '/conflicts',
          {
            params: {
              page: 1,
              limit: 10,
            },
          }
        );
      }
    );

    test(
      'adds only selected active-report filters',
      async () => {
        apiClientMock
          .get
          .mockResolvedValue({
            data: {
              reports: [],
            },
          });

        await getConflictReports({
          page: 3,
          limit: 25,

          status:
            'RESPONDING',

          conflictType:
            'CROP_RAIDING',

          urgency:
            'HIGH',
        });

        expect(
          apiClientMock.get
        ).toHaveBeenCalledWith(
          '/conflicts',
          {
            params: {
              page: 3,
              limit: 25,

              status:
                'RESPONDING',

              conflictType:
                'CROP_RAIDING',

              urgency:
                'HIGH',
            },
          }
        );
      }
    );

    test(
      'loads one active conflict report',
      async () => {
        const data = {
          report: {
            _id:
              'report-1',
          },
        };

        apiClientMock
          .get
          .mockResolvedValue({
            data,
          });

        await expect(
          getConflictReportById(
            'report-1'
          )
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.get
        ).toHaveBeenCalledWith(
          '/conflicts/report-1'
        );
      }
    );

    test(
      'updates Ranger or CLO response',
      async () => {
        const payload = {
          status:
            'RESPONDING',

          urgencyLevel:
            'CRITICAL',

          responseNote:
            'Team dispatched.',
        };

        const data = {
          success: true,

          report: {
            _id:
              'report-1',

            ...payload,
          },
        };

        apiClientMock
          .patch
          .mockResolvedValue({
            data,
          });

        await expect(
          updateConflictResponse(
            'report-1',
            payload
          )
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.patch
        ).toHaveBeenCalledWith(
          '/conflicts/report-1/response',
          payload
        );
      }
    );

    test(
      'archives a report with the supplied reason',
      async () => {
        const data = {
          success: true,

          message:
            'Archived',
        };

        apiClientMock
          .patch
          .mockResolvedValue({
            data,
          });

        await expect(
          archiveConflictReport(
            'report-1',

            'Duplicate operational record'
          )
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.patch
        ).toHaveBeenCalledWith(
          '/conflicts/report-1/archive',
          {
            reason:
              'Duplicate operational record',
          }
        );
      }
    );

    test(
      'loads archived reports with default pagination',
      async () => {
        const data = {
          reports: [],

          pagination: {
            page: 1,
            limit: 10,
          },
        };

        apiClientMock
          .get
          .mockResolvedValue({
            data,
          });

        await expect(
          getArchivedConflictReports()
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.get
        ).toHaveBeenCalledWith(
          '/conflicts/admin/archived',
          {
            params: {
              page: 1,
              limit: 10,
            },
          }
        );
      }
    );

    test(
      'applies archived-report filters when provided',
      async () => {
        apiClientMock
          .get
          .mockResolvedValue({
            data: {
              reports: [],
            },
          });

        await getArchivedConflictReports(
          {
            page: 2,
            limit: 20,

            status:
              'RESOLVED',

            conflictType:
              'OTHER',

            urgency:
              'LOW',
          }
        );

        expect(
          apiClientMock.get
        ).toHaveBeenCalledWith(
          '/conflicts/admin/archived',
          {
            params: {
              page: 2,
              limit: 20,

              status:
                'RESOLVED',

              conflictType:
                'OTHER',

              urgency:
                'LOW',
            },
          }
        );
      }
    );

    test(
      'loads active or archived report through admin endpoint',
      async () => {
        const data = {
          report: {
            _id:
              'report-1',
          },
        };

        apiClientMock
          .get
          .mockResolvedValue({
            data,
          });

        await expect(
          getAdminConflictReportById(
            'report-1'
          )
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.get
        ).toHaveBeenCalledWith(
          '/conflicts/admin/report-1'
        );
      }
    );

    test(
      'restores an archived conflict report',
      async () => {
        const data = {
          success: true,

          message:
            'Restored',
        };

        apiClientMock
          .patch
          .mockResolvedValue({
            data,
          });

        await expect(
          restoreConflictReport(
            'report-1'
          )
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.patch
        ).toHaveBeenCalledWith(
          '/conflicts/report-1/restore'
        );
      }
    );

    test(
      'permanently deletes an archived conflict report',
      async () => {
        const data = {
          success: true,

          message:
            'Deleted',
        };

        apiClientMock
          .delete
          .mockResolvedValue({
            data,
          });

        await expect(
          permanentlyDeleteConflictReport(
            'report-1'
          )
        ).resolves.toEqual(
          data
        );

        expect(
          apiClientMock.delete
        ).toHaveBeenCalledWith(
          '/conflicts/report-1/permanent'
        );
      }
    );

    test(
      'propagates API errors to the calling page',
      async () => {
        const error =
          new Error(
            'Network unavailable'
          );

        apiClientMock
          .get
          .mockRejectedValue(
            error
          );

        await expect(
          getConflictReports()
        ).rejects.toBe(
          error
        );
      }
    );

    test(
      'analytics combines all available report pages',
      async () => {
        apiClientMock
          .get

          .mockResolvedValueOnce({
            data: {
              reports: [
                {
                  _id:
                    'report-1',
                },
              ],

              pagination: {
                page: 1,
                limit: 50,

                totalReports:
                  3,

                totalPages:
                  3,
              },
            },
          })

          .mockResolvedValueOnce({
            data: {
              reports: [
                {
                  _id:
                    'report-2',
                },
              ],

              pagination: {
                page: 2,
                limit: 50,

                totalReports:
                  3,

                totalPages:
                  3,
              },
            },
          })

          .mockResolvedValueOnce({
            data: {
              reports: [
                {
                  _id:
                    'report-3',
                },
              ],

              pagination: {
                page: 3,
                limit: 50,

                totalReports:
                  3,

                totalPages:
                  3,
              },
            },
          });

        await expect(
          getConflictAnalyticsReports()
        ).resolves.toEqual(
          {
            reports: [
              {
                _id:
                  'report-1',
              },

              {
                _id:
                  'report-2',
              },

              {
                _id:
                  'report-3',
              },
            ],

            totalReports:
              3,

            truncated:
              false,
          }
        );

        expect(
          apiClientMock.get
        ).toHaveBeenNthCalledWith(
          1,
          '/conflicts',
          {
            params: {
              page: 1,
              limit: 50,
            },
          }
        );

        expect(
          apiClientMock.get
        ).toHaveBeenNthCalledWith(
          2,
          '/conflicts',
          {
            params: {
              page: 2,
              limit: 50,
            },
          }
        );

        expect(
          apiClientMock.get
        ).toHaveBeenNthCalledWith(
          3,
          '/conflicts',
          {
            params: {
              page: 3,
              limit: 50,
            },
          }
        );
      }
    );

    test(
      'analytics caps loading at 20 pages and marks result as truncated',
      async () => {
        apiClientMock
          .get
          .mockImplementation(
            async (
              _url,
              options
            ) => {
              const page =
                options
                  .params
                  .page;

              return {
                data: {
                  reports: [
                    {
                      _id:
                        `report-${page}`,
                    },
                  ],

                  pagination: {
                    page,

                    limit:
                      50,

                    totalReports:
                      1250,

                    totalPages:
                      25,
                  },
                },
              };
            }
          );

        const result =
          await getConflictAnalyticsReports();

        expect(
          apiClientMock.get
        ).toHaveBeenCalledTimes(
          20
        );

        expect(
          result.reports
        ).toHaveLength(
          20
        );

        expect(
          result.totalReports
        ).toBe(
          1250
        );

        expect(
          result.truncated
        ).toBe(
          true
        );
      }
    );

    test(
      'analytics falls back to loaded report count when totalReports is missing',
      async () => {
        apiClientMock
          .get
          .mockResolvedValue({
            data: {
              reports: [
                {
                  _id:
                    'report-1',
                },

                {
                  _id:
                    'report-2',
                },
              ],

              pagination: {
                totalPages:
                  1,
              },
            },
          });

        await expect(
          getConflictAnalyticsReports()
        ).resolves.toEqual(
          {
            reports: [
              {
                _id:
                  'report-1',
              },

              {
                _id:
                  'report-2',
              },
            ],

            totalReports:
              2,

            truncated:
              false,
          }
        );
      }
    );
  }
);