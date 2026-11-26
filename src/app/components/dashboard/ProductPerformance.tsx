'use client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import CardBox from '../shared/CardBox'
import { Badge } from '@/components/ui/badge'

export const ProductPerformance = ({
  groups,
}: {
  groups: [string, number][]
}) => {
  const total = groups.reduce((s, g) => s + g[1], 0) || 1
  const tones = [
    'bg-primary text-white',
    'bg-secondary text-white',
    'bg-success text-white',
    'bg-warning text-white',
    'bg-error text-white',
    'bg-info text-white',
  ]

  return (
    <CardBox>
      <div id='product' className='mb-6'>
        <div>
          <h5 className='card-title'>Catalog by category</h5>
          <p className='text-sm text-muted-foreground font-normal'>
            Top digital product categories in the published catalog
          </p>
        </div>
      </div>
      <div className='flex flex-col'>
        <div className='-m-1.5 overflow-x-auto'>
          <div className='p-1.5 min-w-full inline-block align-middle'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='text-sm font-semibold'>#</TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Category
                    </TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Products
                    </TableHead>
                    <TableHead className='text-sm font-semibold'>
                      Share
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center text-sm text-muted-foreground py-8'>
                        Catalog sync has not produced category data yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map(([name, n], index) => (
                      <TableRow
                        key={name}
                        className='border-b border-border last:border-b-0'>
                        <TableCell>
                          <p className='text-muted-foreground font-medium text-sm'>
                            {index + 1}
                          </p>
                        </TableCell>
                        <TableCell className='ps-0 min-w-[200px]'>
                          <h6 className='text-sm font-semibold mb-1 capitalize'>
                            {name.replace(/[-_]/g, ' ')}
                          </h6>
                        </TableCell>
                        <TableCell>
                          <p className='font-medium text-muted-foreground text-sm'>
                            {n.toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            <div className='h-1.5 w-24 overflow-hidden rounded-full bg-muted'>
                              <div
                                className='h-full rounded-full bg-primary'
                                style={{
                                  width: Math.max(4, Math.round((n / total) * 100)) + '%',
                                }}
                              />
                            </div>
                            <Badge
                              className={`text-[12px] px-3 rounded-full justify-center py-0.5 ${tones[index % tones.length]}`}>
                              {Math.round((n / total) * 100)}%
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </CardBox>
  )
}
