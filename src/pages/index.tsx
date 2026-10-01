import {
  BookOpenText,
  FileText,
  Boxes,
  MessageCircle,
  ScanSearch,
  BarChart2,
  FileSearch,
  Users,
  Settings,
  PanelsTopLeft,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

import R2RServerCard from '@/components/ChatDemo/ServerCard';
import Layout from '@/components/Layout';
import RequestsCard from '@/components/RequestsCard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CardTitle, CardHeader, CardContent, Card } from '@/components/ui/card';
import { brandingConfig } from '@/config/brandingConfig';
import { useUserContext } from '@/context/UserContext';

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, isSuperUser, pipeline } = useUserContext();
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/arena');
    } else {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout includeFooter>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="relative p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left column - Alert */}
            <div className="w-full lg:w-2/3 flex flex-col gap-4">
              <Alert variant="default" className="flex flex-col">
                <AlertTitle className="text-lg ">
                  <div className="flex gap-2 text-xl">
                    <span className="font-semibold accent-gradient-text">
                      You're connected to your {brandingConfig.deploymentName}{' '}
                      deployment!
                    </span>
                  </div>
                </AlertTitle>
                <AlertDescription>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Here, you'll find a number of tools to help you manage your
                    pipelines and deploy user-facing applications directly to
                    users.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <FileText className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Documents
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Upload, update, and delete documents and their
                          metadata.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <Boxes className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Collections
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Manage and share groups of documents and create
                          knowledge graphs.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <MessageCircle className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Chat
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Generate RAG responses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <ScanSearch className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Search
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Conduct search over your documents and collections.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <Users className="w-5 h-5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Users
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Track user queries, search results, and LLM responses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <FileSearch className="w-5 h-5 text-rose-400 group-hover:text-rose-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Logs
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Track user queries, search results, and LLM responses.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <BarChart2 className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Analytics
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Rich analytics and insights on your users' queries and
                          interactions.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-xl glass-surface hover:bg-white/[0.05] transition-all duration-300 group">
                      <Settings className="w-5 h-5 text-sky-400 group-hover:text-sky-300 transition-colors" />
                      <div>
                        <h3 className="text-sm font-semibold mb-0.5 text-foreground">
                          Settings
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Manage your {brandingConfig.deploymentName} deployment
                          settings and configurations.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="flex space-x-3">
                      <Button
                        variant="outline"
                        className="flex items-center justify-center px-4 py-2 text-sm rounded-xl"
                        onClick={() =>
                          window.open(
                            'https://github.com/lgcorzo/R2R-Engine/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=',
                            '_blank'
                          )
                        }
                      >
                        Feature Request
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center justify-center px-4 py-2 text-sm rounded-xl"
                        onClick={() =>
                          window.open(
                            'https://github.com/lgcorzo/R2R-Engine/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=',
                            '_blank'
                          )
                        }
                      >
                        Report a Bug
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
              {/* SDK Cards */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {brandingConfig.homePage.pythonSdk && (
                    <Card className="w-full sm:w-1/2 flex flex-col">
                      <CardHeader className="flex flex-row items-center space-x-2">
                        <Image
                          src="/images/python-logo.svg"
                          alt="Python Logo"
                          width={30}
                          height={30}
                        />
                        <CardTitle>Python SDK</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-end flex-grow">
                        <div className="flex flex-row space-x-2">
                          <Button
                            variant="outline"
                            className="rounded-xl py-1 px-3"
                            onClick={() =>
                              window.open(
                                'https://r2r-docs.sciphi.ai/documentation/python-sdk/introduction',
                                '_blank'
                              )
                            }
                          >
                            <div className="flex items-center">
                              <BookOpenText size={20} className="mr-2" />
                              <span>Docs</span>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl py-1 px-3"
                            onClick={() =>
                              window.open(
                                'https://github.com/lgcorzo/R2R-Engine/tree/main/py',
                                '_blank'
                              )
                            }
                          >
                            <div className="flex items-center">
                              <Image
                                src="/images/github-mark.svg"
                                alt="GitHub Logo"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                              <span>View on GitHub</span>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {brandingConfig.homePage.githubCard && (
                    <Card className="w-full sm:w-1/2 flex flex-col">
                      <CardHeader className="flex flex-row items-center space-x-2">
                        <Image
                          src="/images/javascript-logo.svg"
                          alt="JavaScript Logo"
                          width={30}
                          height={30}
                        />
                        <CardTitle>JavaScript SDK</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-end flex-grow">
                        <div className="flex flex-row space-x-2">
                          <Button
                            variant="outline"
                            className="rounded-xl py-1 px-3"
                            onClick={() =>
                              window.open(
                                'https://r2r-docs.sciphi.ai/documentation/js-sdk/introduction',
                                '_blank'
                              )
                            }
                          >
                            <div className="flex items-center">
                              <BookOpenText size={20} className="mr-2" />
                              <span>Docs</span>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl py-1 px-3"
                            onClick={() =>
                              window.open(
                                'https://github.com/lgcorzo/R2R-Engine/tree/main/js/sdk',
                                '_blank'
                              )
                            }
                          >
                            <div className="flex items-center">
                              <Image
                                src="/images/github-mark.svg"
                                alt="GitHub Logo"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                              <span>View on GitHub</span>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  {brandingConfig.homePage.hatchetCard && (
                    <Card className="w-full sm:w-1/2 flex flex-col">
                      <CardHeader className="flex flex-row items-center space-x-2">
                        <Image
                          src="/images/hatchet-logo.svg"
                          alt="Python Logo"
                          width={30}
                          height={30}
                        />
                        <CardTitle>Hatchet</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col justify-end flex-grow">
                        <div className="flex flex-row space-x-2">
                          <Button
                            variant="outline"
                            className="rounded-xl py-1 px-3"
                            disabled={
                              !window.__RUNTIME_CONFIG__
                                ?.NEXT_PUBLIC_HATCHET_DASHBOARD_URL ||
                              window.__RUNTIME_CONFIG__.NEXT_PUBLIC_HATCHET_DASHBOARD_URL.includes(
                                '__NEXT_PUBLIC_HATCHET_DASHBOARD_URL__'
                              )
                            }
                            onClick={() => {
                              const url =
                                window.__RUNTIME_CONFIG__
                                  ?.NEXT_PUBLIC_HATCHET_DASHBOARD_URL;
                              if (
                                url &&
                                !url.includes(
                                  '__NEXT_PUBLIC_HATCHET_DASHBOARD_URL__'
                                )
                              ) {
                                window.open(url, '_blank');
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <PanelsTopLeft size={20} className="mr-2" />
                              <span>Dashboard</span>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl py-1 px-3"
                            onClick={() =>
                              window.open(
                                'https://github.com/hatchet-dev/hatchet',
                                '_blank'
                              )
                            }
                          >
                            <div className="flex items-center">
                              <Image
                                src="/images/github-mark.svg"
                                alt="GitHub Logo"
                                width={20}
                                height={20}
                                className="mr-2"
                              />
                              <span>View on GitHub</span>
                            </div>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <div className="w-full sm:w-1/2"></div>
                </div>
              </div>
            </div>

            {/* Right column - Cards */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
              {/* R2R Server Cards */}
              <div className="flex flex-col gap-4 flex-grow">
                {pipeline && (
                  <R2RServerCard
                    pipeline={pipeline}
                    onStatusChange={setIsConnected}
                  />
                )}

                <div className="flex-grow">
                  <RequestsCard />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default HomePage;
